import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Smile, Zap, Frown, Angry, Brain } from 'lucide-react';

export const MoodTracker = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    if (!user) return;

    const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
    const q = query(moodCollectionRef, orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let lastLogTime: Date | null = null;
      if (!querySnapshot.empty) {
        lastLogTime = querySnapshot.docs[0].data().timestamp.toDate();
      }

      if (lastLogTime) {
        const hoursSinceLastLog = (new Date().getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastLog > 5) {
          setShowPrompt(true);
        }
      } else {
        // If there are no entries ever, prompt them.
        setShowPrompt(true);
      }
      setInitialCheckComplete(true);
    });

    return () => unsubscribe();
  }, [user]);

  // This effect will run a timer to check periodically after the initial check.
  useEffect(() => {
    if (!initialCheckComplete) return;

    const intervalId = setInterval(() => {
      // Re-check the condition every 5 minutes
      const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
      const q = query(moodCollectionRef, orderBy('timestamp', 'desc'), limit(1));
      onSnapshot(q, (querySnapshot) => {
        let lastLogTime: Date | null = null;
        if (!querySnapshot.empty) {
          lastLogTime = querySnapshot.docs[0].data().timestamp.toDate();
        }

        if (lastLogTime) {
          const hoursSinceLastLog = (new Date().getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastLog > 5) {
            setShowPrompt(true);
          }
        } else {
          setShowPrompt(true);
        }
      });
    }, 300000); // 300000 ms = 5 minutes

    return () => clearInterval(intervalId);
  }, [initialCheckComplete, user]);


  const handleMoodLog = async (mood: string) => {
    if (!user) return;
    const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
    await addDoc(moodCollectionRef, {
      mood,
      timestamp: new Date(),
    });
    toast.success(`Mood logged: ${mood}`);
    setShowPrompt(false);
  };

  const moodOptions = [
    { mood: 'Productive', icon: <Zap className="w-8 h-8" />, color: "text-green-400" },
    { mood: 'Focused', icon: <Brain className="w-8 h-8" />, color: "text-blue-400" },
    { mood: 'Exhausted', icon: <Frown className="w-8 h-8" />, color: "text-yellow-400" },
    { mood: 'Confused', icon: <Smile className="w-8 h-8" />, color: "text-purple-400" },
    { mood: 'Angry', icon: <Angry className="w-8 h-8" />, color: "text-red-500" },
  ];

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">How are you feeling?</DialogTitle>
          <DialogDescription className="text-center">
            A quick check-in helps you stay aware of your emotional state.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {moodOptions.map(({ mood, icon, color }) => (
            <Button
              key={mood}
              variant="outline"
              className={`flex flex-col h-24 items-center justify-center gap-2 border-2 hover:border-primary ${color}`}
              onClick={() => handleMoodLog(mood)}
            >
              {icon}
              <span className="text-sm">{mood}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};