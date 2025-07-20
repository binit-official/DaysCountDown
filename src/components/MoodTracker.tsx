import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile } from 'lucide-react';
import { toast } from 'sonner';

export const MoodTracker = () => {
  const { user } = useAuth();
  const [lastMoodLog, setLastMoodLog] = useState<Date | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;
    const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
    const q = query(moodCollectionRef, orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const lastLog = querySnapshot.docs[0].data().timestamp.toDate();
        setLastMoodLog(lastLog);
        const hoursSinceLastLog = (new Date().getTime() - lastLog.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastLog > 5) {
          setShowPrompt(true);
        } else {
          setShowPrompt(false);
        }
      } else {
        setShowPrompt(true);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleMoodLog = async (mood: string) => {
    if (!user) return;
    const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
    await addDoc(moodCollectionRef, {
      mood,
      timestamp: new Date(),
    });
    toast.success(`Mood logged: ${mood}`);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <Card className="neon-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smile className="w-5 h-5 mr-2" />
          How are you feeling?
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={() => handleMoodLog('Focused')} size="sm">Focused</Button>
        <Button onClick={() => handleMoodLog('Productive')} size="sm">Productive</Button>
        <Button onClick={() => handleMoodLog('Exhausted')} size="sm" variant="secondary">Exhausted</Button>
        <Button onClick={() => handleMoodLog('Confused')} size="sm" variant="secondary">Confused</Button>
        <Button onClick={() => handleMoodLog('Angry')} size="sm" variant="destructive">Angry</Button>
      </CardContent>
    </Card>
  );
};