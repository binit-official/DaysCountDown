// src/components/AIPlanner.tsx

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from 'firebase/auth';
import { fetchWithRetry } from '@/lib/utils'; // Import the updated utility
import { toast } from 'sonner'; // Import toast for better feedback

// ... (interfaces remain the same)
interface DailyTask {
  day: number;
  task: string;
  completed: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Challenge';
}

interface Roadmap {
  goal: string;
  days: number;
  dailyTasks: DailyTask[];
  startDate: Date;
}

interface AIPlannerProps {
  onRoadmapChange: (roadmap: Roadmap) => void;
  onRoadmapGenerate: (days: number) => void;
  disabled?: boolean;
  user: User | null;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const AIPlanner = ({ onRoadmapChange, onRoadmapGenerate, disabled = false, user }: AIPlannerProps) => {
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoadmap = async () => {
    if (!goal || !days) {
        setError("A goal and number of days are required.");
        return;
    }
    if (!GEMINI_API_KEY) {
        setError("Gemini API key is not configured.");
        return;
    }
    if (!user) {
        setError("You must be logged in to create a plan.");
        return;
    }
    setLoading(true);
    setError(null);
    toast.info("Generating your new mission roadmap... This might take a moment.");

    const prompt = `
      You must create a detailed roadmap for the exact number of days specified. Do not change the number of days.
      Create a detailed ${days}-day roadmap to achieve the goal: "${goal}".
      For each day, provide a detailed, multi-part task using semicolons as a delimiter. For example: "Watch 2 lectures on React Hooks; build 1 small component; read 1 chapter of the documentation."
      Also, for each day, provide a difficulty rating from one of these four options: 'Easy', 'Medium', 'Hard', 'Challenge'.

      Respond ONLY with a valid JSON array of objects. The array must contain exactly ${days} objects. Each object must have three fields:
      1. "day" (number)
      2. "task" (string, the detailed multi-part task)
      3. "difficulty" (string, one of 'Easy', 'Medium', 'Hard', 'Challenge')

      Example for a 2-day plan: [{"day": 1, "task": "Task A; Task B", "difficulty": "Easy"}, {"day": 2, "task": "Task C; Task D", "difficulty": "Medium"}]
    `;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        timeout: 60000, // 60-second timeout for this long-running request
      });

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("Invalid response from Gemini API.");

      const cleanedContent = content.replace(/```json\n?|```/g, '').trim();
      const dailyTasksRaw = JSON.parse(cleanedContent);

      const dailyTasks: DailyTask[] = dailyTasksRaw.map((item: any) => ({
        day: item.day,
        task: item.task,
        difficulty: item.difficulty || 'Medium',
        completed: false,
      }));

      const newRoadmap: Roadmap = {
        goal,
        days,
        dailyTasks,
        startDate: new Date(),
      };

      onRoadmapChange(newRoadmap);
      onRoadmapGenerate(days);
      toast.success("New roadmap generated successfully!");

      const docRef = doc(db, 'users', user.uid, 'data', 'roadmap');
      await setDoc(docRef, newRoadmap, { merge: true });

    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      setError(error.message || 'Failed to generate roadmap.');
      toast.error(`Roadmap generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("p-6 neon-border bg-card/90 backdrop-blur-sm", disabled && "opacity-50 pointer-events-none")}>
        <h3 className="text-lg font-bold mb-6 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            AI Mission Planner
        </h3>
        <div className="space-y-6">
            <div>
                <Label htmlFor="goal" className="text-muted-foreground">Your Goal</Label>
                <Input
                    id="goal"
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Master React in 45 days"
                    className="mt-2 neon-border bg-background/50"
                    disabled={disabled || loading}
                />
            </div>
            <div>
                <Label htmlFor="days" className="text-muted-foreground">Days to Conquer</Label>
                <Input
                    id="days"
                    type="number"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="mt-2 neon-border bg-background/50"
                    min={1}
                    max={365}
                    disabled={disabled || loading}
                />
            </div>
            <Button onClick={generateRoadmap} disabled={disabled || loading} className="w-full cyberpunk-button !mt-8">
                {loading ? 'Generating...' : 'Generate New Plan'}
            </Button>
            {error && <p className="mt-2 text-red-500 text-sm font-semibold">{error}</p>}
        </div>
    </Card>
  );
};

export default AIPlanner;