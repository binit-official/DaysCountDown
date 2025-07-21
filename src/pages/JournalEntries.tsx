import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, documentId, deleteField } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface MoodEntry {
    mood: string;
    timestamp: any;
}

interface FeelingEntry {
    text: string;
    timestamp: any;
}

interface JournalEntry {
  id: string;
  entry?: string;
  moods?: MoodEntry[];
  feelings?: FeelingEntry[];
  timestamp: any;
}

const JournalEntries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditText(entry.entry || '');
  };

  const handleUpdate = async () => {
    if (!user || !editingEntryId) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', editingEntryId);
    await updateDoc(journalDocRef, { entry: editText });
    setEditingEntryId(null);
    setEditText('');
    toast.success('Journal entry updated!');
  };

  const handleDeleteJournalText = async (entryId: string) => {
    if (!user) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', entryId);
    await updateDoc(journalDocRef, {
        entry: deleteField()
    });
    toast.success('Journal entry text deleted!');
  };

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
                    
                    {entry.moods && entry.moods.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Moods Logged</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {entry.moods.map((moodEntry, index) => (
                                <div key={index} className="bg-accent/20 text-accent-foreground px-2 py-1 rounded-md text-xs font-semibold">
                                    {moodEntry.mood}
                                    <span className="text-muted-foreground ml-2">{format(moodEntry.timestamp.toDate(), 'h:mm a')}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {entry.feelings && entry.feelings.length > 0 && (
                       <div>
                        <p className="text-sm font-semibold text-muted-foreground">State of Mind Entries</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                            {entry.feelings.map((feelingEntry, index) => (
                                <li key={index} className="text-sm italic">
                                    <span className="text-muted-foreground mr-2">{format(feelingEntry.timestamp.toDate(), 'h:mm a')}:</span>
                                    "{feelingEntry.text}"
                                </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    
                    {editingEntryId === entry.id ? (
                      <div className="space-y-2">
                         <p className="text-sm font-semibold text-muted-foreground">Journal</p>
                        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="mb-2" />
                        <div className="flex gap-2">
                          <Button onClick={handleUpdate}>Save Changes</Button>
                          <Button variant="outline" onClick={() => setEditingEntryId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {entry.entry && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">Journal</p>
                            <p className="whitespace-pre-wrap">{entry.entry}</p>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => handleEdit(entry)}>
                            {entry.entry ? 'Edit Journal' : 'Add Journal Entry'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={!entry.entry}>Delete Journal</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your journal text for this day. Your mood and state of mind entries will be preserved.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteJournalText(entry.id)}>Delete Journal Text</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
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