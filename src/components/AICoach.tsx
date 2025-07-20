import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const AICoach = () => {
  const { user } = useAuth();
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [mood, setMood] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch latest journal entry
    const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
    const qJournal = query(journalCollectionRef, orderBy('id', 'desc'), limit(1));
    const unsubscribeJournal = onSnapshot(qJournal, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setJournalEntry(querySnapshot.docs[0].data().entry);
      }
    });

    // Fetch latest mood
    const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
    const qMood = query(moodCollectionRef, orderBy('timestamp', 'desc'), limit(1));
    const unsubscribeMood = onSnapshot(qMood, (querySnapshot) => {
      if (!querySnapshot.empty) {
        setMood(querySnapshot.docs[0].data().mood);
      }
    });

    return () => {
      unsubscribeJournal();
      unsubscribeMood();
    };
  }, [user]);

  const generateAdvice = async () => {
    if (!user) return;
    setLoading(true);

    const prompt = `Based on my latest journal entry and mood, provide some advice for today and tomorrow.\n\nJournal: "${journalEntry}"\nMood: "${mood}"`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAdvice(text.trim());
      }
    } catch (error) {
      console.error("Failed to generate advice:", error);
      toast.error("Failed to get advice from AI coach.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="neon-border bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          AI Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        {advice ? (
          <p className="whitespace-pre-wrap">{advice}</p>
        ) : (
          <p className="text-muted-foreground">Click the button to get personalized advice from your AI coach.</p>
        )}
        <Button onClick={generateAdvice} className="w-full mt-4" disabled={loading}>
          {loading ? 'Getting Advice...' : 'Get Advice'}
        </Button>
      </CardContent>
    </Card>
  );
};