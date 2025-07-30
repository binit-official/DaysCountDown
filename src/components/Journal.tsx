import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { format } from 'date-fns';

// This helper function is the key to consistency across all components.
const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const Journal: React.FC<{onJournalSave: () => void}> = ({onJournalSave}) => {
    const { user } = useAuth();
    const [entry, setEntry] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const todayDateString = getLocalDateString();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        // We point to the unified daily log document in the 'journal' collection.
        const docRef = doc(db, 'users', user.uid, 'journal', todayDateString);

        const fetchInitialEntry = async () => {
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // We only care about the 'entry' field here.
                    setEntry(docSnap.data().entry || '');
                } else {
                    setEntry('');
                }
            } catch (error) {
                console.error("Error fetching journal entry:", error);
                toast.error("Could not load today's journal entry.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialEntry();
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setEntry(docSnap.data().entry || '');
            } else {
                setEntry('');
            }
        });

        return () => unsubscribe();
    }, [user, todayDateString]);

    const handleSave = async () => {
        if (!user || !entry.trim()) {
            toast.info("Journal entry cannot be empty.");
            return;
        }
        
        const docRef = doc(db, 'users', user.uid, 'journal', todayDateString);
        
        // This will save or update the 'entry' field in the unified daily log.
        const dataToSave = {
            entry: entry.trim(),
            date: todayDateString,
            lastUpdated: new Date() 
        };

        try {
            // Using { merge: true } is crucial so we don't overwrite moods/feelings.
            await setDoc(docRef, dataToSave, { merge: true });
            toast.success(`Journal entry for ${format(new Date(), "MMMM do")} saved.`);
            onJournalSave();
        } catch (error) {
            console.error("Failed to save journal entry:", error);
            toast.error("Failed to save journal entry.");
        }
    };

    return (
        <Card className="neon-border bg-card/90 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Daily Journal</CardTitle>
                <CardDescription>
                    {format(new Date(), "eeee, MMMM do")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder={isLoading ? "Loading today's entry..." : "What's on your mind today?"}
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    rows={6}
                    disabled={isLoading}
                />
                <Button onClick={handleSave} className="w-full mt-4" disabled={isLoading || !entry.trim()}>
                    Save Entry
                </Button>
            </CardContent>
        </Card>
    );
};