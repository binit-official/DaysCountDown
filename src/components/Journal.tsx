import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface JournalProps {
  onJournalSave: () => void;
}

export const Journal = ({ onJournalSave }: JournalProps) => {
  const { user } = useAuth();
  const [entry, setEntry] = useState('');
  const [todaysEntry, setTodaysEntry] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);
    const unsubscribe = onSnapshot(journalDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().entry) {
        setTodaysEntry(docSnap.data().entry);
        setEntry(docSnap.data().entry);
      } else {
        setTodaysEntry('');
        setEntry('');
      }
    });
    return () => unsubscribe();
  }, [user, today]);

  const handleSaveEntry = async () => {
    if (!user || !entry.trim()) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);
    await setDoc(journalDocRef, { entry: entry, timestamp: new Date() }, { merge: true });
    toast.success('Journal entry saved!');
    setIsEditing(false); 
    onJournalSave(); // Notify parent
  };
  
  const handleCancelEdit = () => {
    setEntry(todaysEntry);
    setIsEditing(false);
  }

  return (
    <Card className="neon-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Today's Journal
          </div>
          {todaysEntry && !isEditing && (
             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4" />
             </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaysEntry && !isEditing ? (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-base whitespace-pre-wrap">{todaysEntry}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="How was your day? What challenges did you face?"
            />
            <div className="flex gap-2">
                <Button onClick={handleSaveEntry} className="w-full">
                  {isEditing ? 'Save Changes' : 'Save Entry'}
                </Button>
                {isEditing && (
                    <Button variant="outline" onClick={handleCancelEdit} className="w-full">
                        Cancel
                    </Button>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};