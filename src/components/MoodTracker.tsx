import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { 
    Smile, Zap, Frown, Angry, Brain, CloudLightning, RotateCw, BatteryLow, BedDouble, 
    Meh, HelpCircle, Wind, Leaf, Sun, Moon, Star, ThumbsUp, Coffee, Bed,
    Brush, HeartHandshake, Sparkles, UserX, Medal
} from 'lucide-react';

interface MoodTrackerProps {
    onMoodLog: () => void;
}

const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const MoodTracker = ({ onMoodLog }: MoodTrackerProps) => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;

    const todayDateString = getLocalDateString();
    const docRef = doc(db, 'users', user.uid, 'journal', todayDateString);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        let lastLogTime: Date | null = null;
        if (docSnap.exists() && docSnap.data().moods?.length > 0) {
            // Find the most recent mood entry
            const lastMood = docSnap.data().moods.reduce((latest: any, current: any) => {
                return latest.timestamp.toDate() > current.timestamp.toDate() ? latest : current;
            });
            lastLogTime = lastMood.timestamp.toDate();
        }
        
        if (lastLogTime) {
            const hoursSinceLastLog = (new Date().getTime() - lastLogTime.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastLog > 5) {
                setShowPrompt(true);
            }
        } else {
            // If no moods logged today, show the prompt
            setShowPrompt(true);
        }
    });

    return () => unsubscribe();
  }, [user]);


  const handleMoodLog = async (mood: string) => {
    if (!user) return;
    const todayDateString = getLocalDateString();
    // This is the critical fix: we point to the correct 'journal' collection
    const docRef = doc(db, 'users', user.uid, 'journal', todayDateString);

    await setDoc(docRef, { 
      moods: arrayUnion({ mood: mood, timestamp: new Date() }),
      date: todayDateString // Also set the date for querying
    }, { merge: true });

    toast.success(`Mood logged: ${mood}`);
    setShowPrompt(false);
    onMoodLog();
  };

  const moodOptions = [
    { mood: 'Productive', icon: <Zap className="w-8 h-8" />, color: "text-green-400" },
    { mood: 'Focused', icon: <Brain className="w-8 h-8" />, color: "text-blue-400" },
    { mood: 'Happy', icon: <Smile className="w-8 h-8" />, color: "text-yellow-400" },
    { mood: 'Confident', icon: <Star className="w-8 h-8" />, color: "text-yellow-300" },
    { mood: 'Creative', icon: <Brush className="w-8 h-8" />, color: "text-purple-400" },
    { mood: 'Grateful', icon: <HeartHandshake className="w-8 h-8" />, color: "text-pink-400" },
    { mood: 'Hopeful', icon: <Sparkles className="w-8 h-8" />, color: "text-teal-300" },
    { mood: 'Proud', icon: <Medal className="w-8 h-8" />, color: "text-amber-500" },
    { mood: 'Okay', icon: <ThumbsUp className="w-8 h-8" />, color: "text-gray-400" },
    { mood: 'Blank', icon: <Meh className="w-8 h-8" />, color: "text-gray-500" },
    { mood: 'Sad', icon: <Frown className="w-8 h-8" />, color: "text-indigo-400" },
    { mood: 'Lonely', icon: <UserX className="w-8 h-8" />, color: "text-gray-600" },
    { mood: 'Stressed', icon: <CloudLightning className="w-8 h-8" />, color: "text-orange-400" },
    { mood: 'Angry', icon: <Angry className="w-8 h-8" />, color: "text-red-500" },
    { mood: 'Overthinking', icon: <RotateCw className="w-8 h-8" />, color: "text-purple-400" },
    { mood: 'Tired', icon: <BatteryLow className="w-8 h-8" />, color: "text-gray-400" },
    { mood: 'Unmotivated', icon: <BedDouble className="w-8 h-8" />, color: "text-pink-400" },
    { mood: 'Sleepy', icon: <Bed className="w-8 h-8" />, color: "text-purple-300" },
    { mood: 'Confused', icon: <HelpCircle className="w-8 h-8" />, color: "text-orange-300" },
    { mood: 'Anxious', icon: <Wind className="w-8 h-8" />, color: "text-teal-400" },
    { mood: 'Calm', icon: <Leaf className="w-8 h-8" />, color: "text-green-300" },
    { mood: 'Energetic', icon: <Sun className="w-8 h-8" />, color: "text-yellow-500" },
    { mood: 'Peaceful', icon: <Moon className="w-8 h-8" />, color: "text-indigo-300" },
    { mood: 'Caffeinated', icon: <Coffee className="w-8 h-8" />, color: "text-amber-600" },
  ];

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">How are you feeling right now?</DialogTitle>
          <DialogDescription className="text-center">
            A quick check-in helps track your emotional state throughout the day.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4 py-4">
          {moodOptions.map(({ mood, icon, color }) => (
            <Button
              key={mood}
              variant="outline"
              className={`flex flex-col h-20 md:h-24 items-center justify-center gap-2 border-2 hover:border-primary ${color}`}
              onClick={() => handleMoodLog(mood)}
            >
              {icon}
              <span className="text-xs md:text-sm">{mood}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};