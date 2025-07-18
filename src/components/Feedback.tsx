import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { MessageSquareWarning, Sparkles } from 'lucide-react';

interface FeedbackProps {
  currentRoadmap: any | null;
  onRoadmapUpdate: (updatedTasks: any[]) => void;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const Feedback = ({ currentRoadmap, onRoadmapUpdate }: FeedbackProps) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackSubmit = async () => {
    if (!feedback) {
      setError('Please enter your feedback before submitting.');
      return;
    }
    if (!currentRoadmap) {
      setError('Please generate a roadmap before providing feedback.');
      return;
    }

    setLoading(true);
    setError(null);

    const prompt = `
      A user is on a ${currentRoadmap.days}-day plan to achieve the goal: "${currentRoadmap.goal}".
      This is their original daily plan: ${JSON.stringify(currentRoadmap.dailyTasks)}
      
      The user is feeling frustrated and provided this feedback: "${feedback}"

      Please analyze their feedback and adjust the remaining daily tasks to be more manageable, encouraging, or broken down into smaller steps to help them get back on track.
      Respond ONLY with a valid JSON array of objects for the updated daily tasks. Each object must have a "day" (number) and "task" (string) field. Do not include any text, markdown, or explanations before or after the JSON array.
    `;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('Invalid response structure from Gemini API.');
      }

      const cleanedContent = content.replace(/```json\n?|```/g, '').trim();
      const updatedTasks = JSON.parse(cleanedContent);
      
      onRoadmapUpdate(updatedTasks);
      setFeedback(''); // Clear feedback after submission

    } catch (err: any) {
      console.error('Error adjusting roadmap:', err);
      setError(err.message || 'Failed to adjust roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-secondary/50">
      <h3 className="flex items-center text-lg font-bold mb-4">
        <MessageSquareWarning className="w-5 h-5 mr-2 text-secondary" />
        Feeling Stuck? Vent Here.
      </h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="feedback" className="text-muted-foreground">
            Share your frustrations. The AI will adapt your plan.
          </Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g., 'This is too hard', 'I have no time', 'I'm not making progress...'"
            className="neon-border bg-background/50 mt-2"
          />
        </div>
        <Button
          onClick={handleFeedbackSubmit}
          disabled={loading || !currentRoadmap}
          className="w-full cyberpunk-button border-secondary/80"
        >
          {loading ? (
            'Adapting Plan...'
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Adapt My Plan
            </>
          )}
        </Button>
        {error && <p className="mt-2 text-red-500 text-sm font-semibold">{error}</p>}
        {!currentRoadmap && <p className="mt-2 text-yellow-500 text-xs text-center">Generate a roadmap first to enable this feature.</p>}
      </div>
    </Card>
  );
};