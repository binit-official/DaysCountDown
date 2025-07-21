import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithRetry } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const FeelingTracker = () => {
  const { user } = useAuth();
  const [feeling, setFeeling] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeAndSaveFeeling = async (feelingText: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);

    // 1. Send to Gemini for classification
    const prompt = `Analyze the sentiment of the following text and classify it into one of these categories: Productive, Focused, Exhausted, Confused, Angry, Happy, Sad, Anxious, Calm, Motivated, Stressed. Respond with ONLY the single category name. Text: "${feelingText}"`;

    try {
        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await response.json();
        const mood = data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || 'Neutral';

        // 2. Save the classified mood to the daily journal document
        await setDoc(journalDocRef, { 
            mood: mood,
            timestamp: new Date()
        }, { merge: true });

        toast.success(`Emotional Stat Updated: ${mood}`);

    } catch (error) {
        console.error("Failed to analyze mood:", error);
        toast.error("Could not analyze mood, but your entry was saved.");
    }
  };

  const handleSaveFeeling = async () => {
    if (!user || !feeling.trim()) return;
    setLoading(true);
    
    // Save the raw text feeling to the daily journal document
    const today = new Date().toISOString().split('T')[0];
    const journalDocRef = doc(db, 'users', user.uid, 'journal', today);
    await setDoc(journalDocRef, { 
        feelingText: feeling, 
        timestamp: new Date() 
    }, { merge: true });
    
    toast.success('Your feeling has been recorded.');
    
    // Also analyze and save for stats
    await analyzeAndSaveFeeling(feeling);

    setFeeling('');
    setLoading(false);
  };

  return (
    <Card className="neon-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center">
          <HeartPulse className="w-5 h-5 mr-2 text-accent" />
          State of Mind
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">How are you feeling right now?</p>
        <Textarea
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          placeholder="e.g., 'Feeling a bit stressed about the deadline, but motivated to push through.'"
          className="mb-4"
          disabled={loading}
        />
        <Button onClick={handleSaveFeeling} className="w-full cyberpunk-button" disabled={loading}>
          {loading ? 'Analyzing...' : 'Save Feeling'}
        </Button>
      </CardContent>
    </Card>
  );
};