import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchWithFallback } from '@/lib/utils';
import { toast } from 'sonner';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY_2 = import.meta.env.VITE_GEMINI_API_KEY_2;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";


interface AIPlannerProps {
    onRoadmapChange: (roadmap: any) => void;
    onRoadmapGenerate: (days: number) => void;
    disabled: boolean;
    user: any;
}

const AIPlanner: React.FC<AIPlannerProps> = ({ onRoadmapChange, onRoadmapGenerate, disabled, user }) => {
    const [goal, setGoal] = useState('');
    const [days, setDays] = useState(30);
    const [generating, setGenerating] = useState(false);

    const handleGenerateRoadmap = async () => {
        if (!goal || !days || !user) return;
        setGenerating(true);
        toast.info("Nyx is crafting your roadmap...");

        const prompt = `
            You are an expert project manager named Nyx. Your task is to create a detailed, realistic, day-by-day roadmap for a user trying to achieve a goal.
            The user's goal is: "${goal}"
            The user wants to achieve this in ${days} days.

            For each of the ${days} days, provide a multi-part task list separated by semicolons. This represents the work for that single day.
            Also, provide a difficulty rating for each day: 'Easy', 'Medium', 'Hard', or 'Challenge'.

            Respond ONLY with a valid JSON object. This object must have one key: "dailyTasks".
            The value of "dailyTasks" must be a JSON array of exactly ${days} objects.
            Each object in the array must have three fields: "day" (a number from 1 to ${days}), "task" (a string), and "difficulty" (a string).
            Do not include any other text, explanations, or markdown formatting like \`\`\`json.
        `;
        
        try {
            const response = await fetchWithFallback(
                API_BASE_URL,
                GEMINI_API_KEY,
                GEMINI_API_KEY_2,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                }
            );

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) throw new Error("AI failed to generate a valid plan.");
            
            const parsedContent = JSON.parse(content);
            const newRoadmap = {
                goal,
                days,
                dailyTasks: parsedContent.dailyTasks.map((task: any) => ({ ...task, completed: false })),
            };
            onRoadmapChange(newRoadmap);
            onRoadmapGenerate(days);
            toast.success("Roadmap generated!");

        } catch (error: any) {
            console.error("Error generating roadmap:", error);
            toast.error(`Roadmap generation failed: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Card className="neon-border bg-card/90 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>AI Roadmap Planner</CardTitle>
                <CardDescription>Generate a new daily plan for a mission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="goal">Your Goal</Label>
                    <Input id="goal" placeholder="e.g., Learn React for a month" value={goal} onChange={(e) => setGoal(e.target.value)} disabled={disabled || generating} />
                </div>
                <div>
                    <Label htmlFor="days">Duration (in days)</Label>
                    <Input id="days" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} disabled={disabled || generating} />
                </div>
                <Button onClick={handleGenerateRoadmap} disabled={disabled || generating || !goal || days <= 0}>
                    {generating ? 'Generating...' : 'Generate Plan'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default AIPlanner;