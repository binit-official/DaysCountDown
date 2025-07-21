import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, documentId } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  entry?: string;
  mood?: string;
  feelingText?: string;
  timestamp: any;
}

const JournalEntries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
    const q = query(journalCollectionRef, orderBy(documentId(), 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const journalEntries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
      setEntries(journalEntries);
    });
    return () => unsubscribe();
  }, [user]);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <Button onClick={() => navigate(-1)} className="mb-8 cyberpunk-button">Back to Dashboard</Button>
        <Card className="neon-border bg-card/90">
          <CardHeader>
            <CardTitle>Journal Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length > 0 ? (
              <ul className="space-y-4">
                {entries.map((entry) => (
                  <li key={entry.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <p className="text-lg font-bold text-primary">{format(new Date(entry.id), 'MMMM d, yyyy')}</p>
                    
                    {entry.mood && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Mood</p>
                        <p className="font-bold text-accent">{entry.mood}</p>
                      </div>
                    )}

                    {entry.feelingText && (
                       <div>
                        <p className="text-sm font-semibold text-muted-foreground">State of Mind</p>
                        <p className="italic">"{entry.feelingText}"</p>
                      </div>
                    )}
                    
                    {entry.entry && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Journal</p>
                        <p className="whitespace-pre-wrap">{entry.entry}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground">No journal entries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JournalEntries;