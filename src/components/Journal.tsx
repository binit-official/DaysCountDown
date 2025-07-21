import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export const Journal = () => {
  const { user } = useAuth();
  const [entry, setEntry] = useState('');
  const [todaysEntry, setTodaysEntry] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);
    const unsubscribe = onSnapshot(journalDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTodaysEntry(docSnap.data().entry);
      } else {
        setTodaysEntry('');
      }
    });
    return () => unsubscribe();
  }, [user, today]);

  const handleSaveEntry = async () => {
    if (!user || !entry.trim()) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);
    await setDoc(journalDocRef, { entry: entry, timestamp: new Date() }, { merge: true });
    toast.success('Journal entry saved!');
    setEntry(''); // Clear the input field
  };

  return (
    <Card className="neon-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Today's Journal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaysEntry ? (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Today's Entry (view in Journal page):</p>
            <p className="text-base whitespace-pre-wrap">{todaysEntry}</p>
          </div>
        ) : (
          <>
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="How was your day? What challenges did you face?"
              className="mb-4"
            />
            <Button onClick={handleSaveEntry} className="w-full">
              Save Entry
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};