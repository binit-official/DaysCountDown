import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

interface DailyTask {
  day: number;
  task: string;
  completed: boolean;
}

interface Roadmap {
  goal: string;
  days: number;
  dailyTasks: DailyTask[];
}

// 1. Access the Gemini API key from environment variables
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const AIPlanner = () => {
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState(45);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
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

    if (uid) {
      const docRef = doc(db, 'roadmaps', uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setRoadmap(docSnap.data() as Roadmap);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const generateRoadmap = async () => {
    if (!goal || !days || !GEMINI_API_KEY) {
        setError("Goal, days, and a valid API key are required.");
        return;
    }
    setLoading(true);
    setError(null);

    const prompt = `Create a detailed ${days}-day roadmap to achieve the goal: "${goal}". Respond ONLY with a valid JSON array of objects. Each object must have a "day" (number) and "task" (string) field. Do not include any text, markdown, or explanations before or after the JSON array.`;

    // 2. Use the Gemini API endpoint
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 3. Structure the request body for Gemini
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini API response:', data);

      // 4. Parse the response from Gemini's structure
      if (!data.candidates || !data.candidates[0].content) {
        throw new Error("Invalid response structure from Gemini API.");
      }
      const content = data.candidates[0].content.parts[0].text;
      
      let dailyTasksRaw;
      try {
        // Clean up potential markdown formatting from the response
        const cleanedContent = content.replace(/```json\n|```/g, '').trim();
        dailyTasksRaw = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse JSON from Gemini content:', parseError);
        setError(`Failed to parse AI response. Raw content: ${content}`);
        setLoading(false);
        return;
      }

      const dailyTasks: DailyTask[] = dailyTasksRaw.map((item: any) => ({
        day: item.day,
        task: item.task,
        completed: false,
      }));

      const newRoadmap: Roadmap = {
        goal,
        days,
        dailyTasks,
      };

      setRoadmap(newRoadmap);

      if (userId) {
        const docRef = doc(db, 'roadmaps', userId);
        await setDoc(docRef, newRoadmap);
      }
    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      setError(error.message || 'Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Your JSX remains the same
  return (
    <div className="p-4 bg-card rounded-md shadow-md">
        <h2 className="text-xl font-bold mb-4">AI Goal Planner 🚀</h2>
        <div className="mb-4">
            <label htmlFor="goal" className="block font-semibold mb-1">Goal:</label>
            <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                placeholder="e.g., Learn how to bake sourdough"
            />
        </div>
        <div className="mb-4">
            <label htmlFor="days" className="block font-semibold mb-1">Days:</label>
            <input
                id="days"
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                min={1}
                max={365}
            />
        </div>
        <button
            onClick={generateRoadmap}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
        >
            {loading ? 'Generating...' : 'Generate Roadmap'}
        </button>
        {error && <p className="mt-4 text-red-600 font-semibold">Error: {error}</p>}
        {roadmap && (
            <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Your Roadmap for: {roadmap.goal}</h3>
                <ul className="list-disc list-inside max-h-96 overflow-y-auto border p-2 rounded-md">
                    {roadmap.dailyTasks.map((task) => (
                        <li key={task.day} className="mb-1">
                           <strong>Day {task.day}:</strong> {task.task}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
};

export default AIPlanner;