// src/components/AIAssistant.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, User, CornerDownLeft, RefreshCw, BrainCircuit, Flame } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface AIAssistantProps {
  currentRoadmap: any | null;
  onRoadmapUpdate: (updatedTasks: any[]) => void;
  hasIncompleteTasks: boolean;
  allTasksCompleted: boolean;
  currentDay: number;
  isNewUser: boolean;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  proposedPlan?: any[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const AIAssistant = ({ currentRoadmap, onRoadmapUpdate, hasIncompleteTasks, allTasksCompleted, currentDay, isNewUser }: AIAssistantProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiPersona, setAiPersona] = useState<'nyx' | 'general'>('nyx');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const generateInitialMessage = async () => {
    let prompt = "";
    if (aiPersona === 'nyx') {
        const persona = "You are Nyx, an AI accountability coach. Your personality is sharp, witty, and direct—like a tough-love friend. You're encouraging but not cheesy. Your tone is conversational and straightforward. Avoid overly complex vocabulary and keep responses concise.";
        if (isNewUser) {
            prompt = `${persona} A new user just signed up. Generate a welcome message that instructs them to create their first mission in the 'Active Missions' panel on the left.`;
        } else if (currentRoadmap) {
            if (allTasksCompleted) prompt = `${persona} The user has completed their goal: "${currentRoadmap.goal}". Generate a unique, celebratory message.`;
            else if (hasIncompleteTasks) prompt = `${persona} The user has incomplete tasks. Generate a firm but motivational message to get them back on track.`;
            else prompt = `${persona} The user is on track with their goal: "${currentRoadmap.goal}". Generate a unique, witty greeting.`;
        } else {
            setMessages([{ id: Date.now(), sender: 'ai', text: "Nyx here. What's the mission?" }]);
            return;
        }
    } else {
        prompt = "You are a helpful and friendly general-purpose AI assistant. Greet the user and ask how you can help them today.";
    }

    if (!prompt) return;

    setLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setMessages([{ id: Date.now(), sender: 'ai', text: text.trim() }]);
      }
    } catch (error) {
      console.error("Failed to generate initial message:", error);
      setMessages([{ id: Date.now(), sender: 'ai', text: "AI is currently offline." }]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    setMessages([]);
    generateInitialMessage();
  }, [aiPersona, isNewUser]);


  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const conversationHistory = newMessages.map(msg => `[${msg.sender.toUpperCase()}]: ${msg.text}`).join('\n');
    
    const nyxPrompt = `
      You are Nyx, an AI accountability coach with a sharp, witty, and direct personality. The user's current goal is: "${currentRoadmap?.goal || 'Not set'}".
      If the message is about their goal or productivity, provide tough-love advice. If it's a general question, you can answer it but with your unique, slightly impatient and sarcastic personality.
      If you propose a new plan, YOU MUST format your response as: [Conversational text] ---JSON--- [A valid JSON array of updated tasks]. There should be NO text after the JSON block.
      Conversation History:
      ${conversationHistory}
    `;

    const generalPrompt = `
      You are a standard, helpful, and friendly AI assistant.
      The user is using a productivity application, but your role in this mode is to be a general assistant.
      Answer the user's question directly and clearly based on the conversation history.
      Conversation History:
      ${conversationHistory}
    `;

    const prompt = aiPersona === 'nyx' ? nyxPrompt : generalPrompt;

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
        let jsonText = parts.length > 1 ? parts[1].trim() : null;

        const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: conversationalText };

        if (jsonText && aiPersona === 'nyx') {
            const jsonMatch = jsonText.match(/(\[.*\]|\{.*\})/s);
            if (jsonMatch) {
                aiMessage.proposedPlan = JSON.parse(jsonMatch[0]);
            }
        }
        
        setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
        let displayError = `Sorry, I hit a snag. Try again.`;
        if (typeof err.message === 'string' && err.message.toLowerCase().includes('quota')) {
            displayError = "It seems the AI is a bit popular right now and has hit its usage limit. Please try again later."
        }
        const errorMessage: Message = { id: Date.now() + 1, sender: 'ai', text: displayError };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    generateInitialMessage();
  };

  const handleAcceptPlan = (plan: any[]) => {
    onRoadmapUpdate(plan);
    setMessages(prev => prev.filter(msg => !msg.proposedPlan).concat({ id: Date.now(), sender: 'ai', text: "Plan updated. Let's see you stick to this one." }));
  };

  const handleDeclinePlan = () => {
    setMessages(prev => prev.filter(msg => !msg.proposedPlan).concat({ id: Date.now(), sender: 'ai', text: "Fine. Your call. The original plan stands." }));
  };

  return (
    <Card className="flex flex-col h-[380px] neon-border bg-card/90 backdrop-blur-sm border-secondary/50">
      <div className="flex items-center justify-between p-3 border-b border-secondary/20 flex-shrink-0">
        <ToggleGroup type="single" value={aiPersona} onValueChange={(value: 'nyx' | 'general') => value && setAiPersona(value)} className="justify-start">
            <ToggleGroupItem value="nyx" aria-label="Switch to Nyx" className="flex gap-2 data-[state=on]:bg-secondary/20 data-[state=on]:text-secondary">
                <Flame className="w-4 h-4" /> Nyx
            </ToggleGroupItem>
            <ToggleGroupItem value="general" aria-label="Switch to General AI" className="flex gap-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
                <BrainCircuit className="w-4 h-4" /> General
            </ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-7 w-7">
            <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
        <div className="p-3 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-12 px-4">
              <p className="font-bold">Start a new conversation.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <Bot className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />}
              <div className={`p-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-primary/20' : 'bg-secondary/10'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                {msg.proposedPlan && aiPersona === 'nyx' && (
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
          {loading && (
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
            placeholder={isNewUser ? "Create a mission to begin..." : `Chat with ${aiPersona === 'nyx' ? 'Nyx' : 'General AI'}...`}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            className="pr-10 bg-background/50 text-sm"
            rows={1}
            disabled={isNewUser || loading}
          />
          <Button size="icon" onClick={handleSendMessage} disabled={isNewUser || loading} className="absolute right-1.5 bottom-1 h-7 w-7"><CornerDownLeft className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  );
};