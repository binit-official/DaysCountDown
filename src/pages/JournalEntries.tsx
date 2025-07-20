import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, documentId } from 'firebase/firestore';
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

const JournalEntries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<{ id: string; entry: string }[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!user) return;
    const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
    const q = query(journalCollectionRef, orderBy(documentId(), 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const journalEntries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; entry: string }));
      setEntries(journalEntries);
    });
    return () => unsubscribe();
  }, [user]);

  const handleEdit = (entry: { id: string; entry: string }) => {
    setEditingEntryId(entry.id);
    setEditText(entry.entry);
  };

  const handleUpdate = async () => {
    if (!user || !editingEntryId) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', editingEntryId);
    await updateDoc(journalDocRef, { entry: editText });
    setEditingEntryId(null);
    setEditText('');
    toast.success('Journal entry updated!');
  };

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    const journalDocRef = doc(db, 'users', user.uid, 'journal', entryId);
    await deleteDoc(journalDocRef);
    toast.success('Journal entry deleted!');
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
                {entries.map(({ id, entry }) => (
                  <li key={id} className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-bold text-muted-foreground">{format(new Date(id), 'MMMM d, yyyy')}</p>
                    {editingEntryId === id ? (
                      <div className="mt-2">
                        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="mb-2" />
                        <div className="flex gap-2">
                          <Button onClick={handleUpdate}>Save</Button>
                          <Button variant="outline" onClick={() => setEditingEntryId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mt-2">{entry}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => handleEdit({ id, entry })}>Edit</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your journal entry.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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