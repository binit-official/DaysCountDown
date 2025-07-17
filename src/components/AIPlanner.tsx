import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

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
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const AIPlanner = ({ onRoadmapChange }: AIPlannerProps) => {
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState(45);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = 'user-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', uid);
    }
    setUserId(uid);
  }, []);

  const generateRoadmap = async () => {
    if (!goal || !days) {
        setError("A goal and number of days are required.");
        return;
    }
    if (!GEMINI_API_KEY) {
        setError("Gemini API key is not configured.");
        return;
    }
    setLoading(true);
    setError(null);

    const prompt = `
      Create a detailed ${days}-day roadmap to achieve the goal: "${goal}".
      For each day, provide a detailed, multi-part task. For example: "Watch 2 lectures on React Hooks, build 1 small component, and read 1 chapter of the documentation."
      Also, for each day, provide a difficulty rating from one of these four options: 'Easy', 'Medium', 'Hard', 'Challenge'.

      Respond ONLY with a valid JSON array of objects. Each object must have three fields:
      1. "day" (number)
      2. "task" (string, the detailed multi-part task)
      3. "difficulty" (string, one of 'Easy', 'Medium', 'Hard', 'Challenge')
      
      Example: [{"day": 1, "task": "Task A, Task B, Task C", "difficulty": "Medium"}]
    `;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!response.ok) throw new Error((await response.json()).error?.message || 'API request failed');

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

      if (userId) {
        const docRef = doc(db, 'roadmaps', userId);
        await setDoc(docRef, newRoadmap);
      }
    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      setError(error.message || 'Failed to generate roadmap.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-md shadow-md h-full">
      <h2 className="text-xl font-bold mb-4">AI Mission Planner 🚀</h2>
       <div className="mb-4">
            <label htmlFor="goal" className="block font-semibold mb-1">Goal:</label>
            <input id="goal" type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full p-2 border border-gray-300 rounded text-black bg-white" placeholder="e.g., Master React in 45 Days" />
        </div>
        <div className="mb-4">
            <label htmlFor="days" className="block font-semibold mb-1">Days:</label>
            <input id="days" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded text-black bg-white" min={1} max={365} />
        </div>
        <button onClick={generateRoadmap} disabled={loading} className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate New Plan'}
        </button>
        {error && <p className="mt-4 text-red-600 font-semibold">Error: {error}</p>}
    </div>
  );
};

export default AIPlanner;