// src/components/AIAssistant.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Sparkles, Bot, User, CornerDownLeft } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AIAssistantProps {
  currentRoadmap: any | null;
  onRoadmapUpdate: (updatedTasks: any[]) => void;
  hasIncompleteTasks: boolean;
  allTasksCompleted: boolean;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  proposedPlan?: any[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const AIAssistant = ({ currentRoadmap, onRoadmapUpdate, hasIncompleteTasks, allTasksCompleted }: AIAssistantProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const initialMessageSent = useRef(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const generateInitialMessage = async () => {
      if (!currentRoadmap || initialMessageSent.current) return;

      let prompt = "";
      if (allTasksCompleted) {
        prompt = `
          You are Nyx, a witty, no-nonsense, tough-love AI coach. The user has just completed their entire roadmap for the goal: "${currentRoadmap.goal}".
          Generate a unique, celebratory, and motivational message congratulating them. Don't be generic. Make it sound like a genuine, energetic victory speech from your persona, Nyx.
        `;
      } else if (hasIncompleteTasks) {
        const incompleteTasks = currentRoadmap.dailyTasks.filter((task: any) => task.day < new Date().getDate() && !task.completed).map((task: any) => `Day ${task.day}: ${task.task}`).join(', ');
        prompt = `
          You are Nyx, a witty, no-nonsense, tough-love AI coach. The user has logged in and has these incomplete tasks from previous days: ${incompleteTasks}.
          Generate a unique, firm, but motivational message from your persona, Nyx, urging them to complete these overdue tasks. Be creative and direct.
        `;
      }

      if (prompt) {
        initialMessageSent.current = true;
        setLoading(true);
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          });
          if (!response.ok) throw new Error('Failed to get a response from the AI.');
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            setMessages([{ id: Date.now(), sender: 'ai', text: text.trim() }]);
          }
        } catch (error: any) {
          console.error("Failed to generate initial AI message:", error);
          setMessages([{ id: Date.now(), sender: 'ai', text: "Nyx here. Let's get to work." }]);
        } finally {
          setLoading(false);
        }
      }
    };

    generateInitialMessage();
  }, [hasIncompleteTasks, allTasksCompleted, currentRoadmap]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentRoadmap) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const conversationHistory = newMessages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

    const prompt = `
      You are Nyx, a witty, no-nonsense, tough-love AI coach.
      The user's goal is: "${currentRoadmap.goal}".
      Their current daily plan is: ${JSON.stringify(currentRoadmap.dailyTasks)}
      Conversation so far:
      ${conversationHistory}
      Your tasks:
      1. Respond conversationally as Nyx.
      2. Analyze the user's message. DO NOT propose a new plan unless the user seems truly stuck, is making excuses, or directly asks for help.
      3. If a new plan is needed, format your response as: [Conversational text] ---JSON--- [JSON array of tasks]
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!response.ok) throw new Error((await response.json()).error?.message || 'API request failed');

      const data = await response.json();
      const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) throw new Error('Invalid API response.');

      const parts = rawContent.split('---JSON---');
      const conversationalText = parts[0].trim();
      const jsonText = parts.length > 1 ? parts[1].replace(/```json\n?|```/g, '').trim() : null;

      const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: conversationalText };

      if (jsonText) {
        aiMessage.proposedPlan = JSON.parse(jsonText);
      }

      setMessages(prev => [...prev, aiMessage]);

    } catch (err: any) {
      const errorMessage: Message = { id: Date.now() + 1, sender: 'ai', text: `Error: ${err.message}. Try again.` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPlan = (plan: any[]) => {
    onRoadmapUpdate(plan);
    setMessages(prev => prev.filter(msg => !msg.proposedPlan).concat({ id: Date.now(), sender: 'ai', text: "Plan updated. No more excuses." }));
  };

  const handleDeclinePlan = () => {
    setMessages(prev => prev.filter(msg => !msg.proposedPlan).concat({ id: Date.now(), sender: 'ai', text: "Fine. Stick to the original plan." }));
  };

  return (
    <Card className="flex flex-col h-[380px] neon-border bg-card/90 backdrop-blur-sm border-secondary/50">
      <div className="flex items-center p-3 border-b border-secondary/20 flex-shrink-0">
        <Bot className="w-5 h-5 mr-2 text-secondary animate-pulse" />
        <h3 className="text-lg font-bold neon-text text-secondary">NYX</h3>
      </div>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12 px-4">
              <p className="font-bold">Feeling stuck?</p>
              <p className="text-sm">Tell Nyx.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <Bot className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />}
              <div className={`p-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-primary/20' : 'bg-secondary/10'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                {msg.proposedPlan && (
                  <div className="mt-2 pt-2 border-t border-secondary/20 space-y-1">
                    <p className="text-xs font-bold text-secondary">PROPOSED PLAN:</p>
                    <div className="flex gap-2">
                       <Button size="sm" onClick={() => handleAcceptPlan(msg.proposedPlan!)} className="h-7">Accept</Button>
                       <Button size="sm" variant="outline" onClick={handleDeclinePlan} className="h-7">Decline</Button>
                    </div>
                  </div>
                )}
              </div>
              {msg.sender === 'user' && <User className="w-5 h-5 text-primary flex-shrink-0 mt-1" />}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.sender === 'user' && (
            <div className="flex justify-start">
              <Bot className="w-5 h-5 text-secondary animate-spin" />
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-secondary/20 flex-shrink-0">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!currentRoadmap ? "Generate a roadmap first..." : "Type here..."}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            className="pr-10 bg-background/50 text-sm"
            rows={1}
            disabled={!currentRoadmap || loading}
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!currentRoadmap || loading} className="absolute right-1.5 bottom-1 h-7 w-7"><CornerDownLeft className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  );
};