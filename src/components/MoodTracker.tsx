import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Smile, Zap, Frown, Angry, Brain, CloudLightning, RotateCw, BatteryLow, BedDouble } from 'lucide-react';

export const MoodTracker = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);

    const checkMood = (lastLogTime: Date | null) => {
      if (lastLogTime) {
        const hoursSinceLastLog = (new Date().getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastLog > 5) {
          setShowPrompt(true);
        }
      } else {
        setShowPrompt(true);
      }
    };

    const unsubscribe = onSnapshot(journalDocRef, (docSnap) => {
        let lastLogTime: Date | null = null;
        if (docSnap.exists() && docSnap.data().moods?.length > 0) {
            const lastMood = docSnap.data().moods.slice(-1)[0];
            lastLogTime = lastMood.timestamp.toDate();
        }
        checkMood(lastLogTime);
        if (!initialCheckComplete) setInitialCheckComplete(true);
    });

    return () => unsubscribe();
  }, [user, initialCheckComplete]);


  const handleMoodLog = async (mood: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);
    await setDoc(journalDocRef, { 
      moods: arrayUnion({ mood: mood, timestamp: new Date() })
    }, { merge: true });
    toast.success(`Mood logged: ${mood}`);
    setShowPrompt(false);
  };

  const moodOptions = [
    { mood: 'Happy', icon: <Smile className="w-8 h-8" />, color: "text-yellow-400" },
    { mood: 'Productive', icon: <Zap className="w-8 h-8" />, color: "text-green-400" },
    { mood: 'Focused', icon: <Brain className="w-8 h-8" />, color: "text-blue-400" },
    { mood: 'Sad', icon: <Frown className="w-8 h-8" />, color: "text-indigo-400" },
    { mood: 'Stressed', icon: <CloudLightning className="w-8 h-8" />, color: "text-orange-400" },
    { mood: 'Overthinking', icon: <RotateCw className="w-8 h-8" />, color: "text-purple-400" },
    { mood: 'Angry', icon: <Angry className="w-8 h-8" />, color: "text-red-500" },
    { mood: 'Tired', icon: <BatteryLow className="w-8 h-8" />, color: "text-gray-400" },
    { mood: 'Unmotivated', icon: <BedDouble className="w-8 h-8" />, color: "text-pink-400" },
  ];

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">How are you feeling?</DialogTitle>
          <DialogDescription className="text-center">
            A quick check-in helps track your emotional state.
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