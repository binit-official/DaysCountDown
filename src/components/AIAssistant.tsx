// src/components/AIAssistant.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Bot, User, CornerDownLeft, X } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { fetchWithRetry } from '@/lib/utils';
import { toast } from 'sonner';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface AIAssistantProps {
  currentRoadmap: any | null;
  hasIncompleteTasks: boolean;
  allTasksCompleted: boolean;
  currentDay: number;
  isNewUser: boolean;
  onInfuseTasks: () => void;
  onReplan: () => Promise<void>;
}

export const AIAssistant = ({ currentRoadmap, hasIncompleteTasks, allTasksCompleted, currentDay, isNewUser, onInfuseTasks, onReplan }: AIAssistantProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    const initialMessage = isNewUser
        ? "Welcome! I'm Nyx, your AI assistant. To get started, let's create your first long-term mission in the 'Mission Control' panel on the left."
        : hasIncompleteTasks
        ? `You have incomplete tasks from previous days. You can either infuse them into your schedule or ask me to generate a completely new, optimized plan for the remaining days. You can also chat with me for advice or feedback.`
        : "Hello! How can I help you adapt your mission today? Ask me for advice, feedback on your progress, or to adjust your plan.";
    
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        const conversationHistory = newMessages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
        
        const prompt = `
            You are an AI assistant named "Nyx" for a goal-setting app called "Days Count Down".
            Your primary role is to provide strategic advice, motivation, and help the user adapt their plans.
            Do NOT answer general knowledge questions. If the user asks for something outside of planning or motivation, gently guide them back to their mission.

            Current Context:
            - User's Goal: "${currentRoadmap?.goal || 'Not set'}"
            - Total Days in Plan: ${currentRoadmap?.days || 'N/A'}
            - Today is Day: ${currentDay}
            - All tasks are completed so far: ${!hasIncompleteTasks}

            Conversation History:
            ${conversationHistory}
            Nyx:
        `;

        try {
            const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                setMessages(prev => [...prev, { sender: 'ai', text: text.trim() }]);
            }
        } catch (error: any) {
            toast.error(`Failed to get response from Nyx: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-8 right-8 z-50">
                <Button onClick={() => setIsOpen(true)} className="h-16 w-16 rounded-full shadow-lg">
                    <Sparkles className="w-8 h-8" />
                </Button>
            </div>
        );
    }
    
    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Card className="flex flex-col h-[480px] w-96 neon-border bg-card/90 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-secondary/20">
                    <CardTitle className="flex items-center text-base">
                        <Sparkles className="w-5 h-5 mr-2" />
                        AI Assistant (Nyx)
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7"><X className="w-4 h-4" /></Button>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <CardContent className="p-3 space-y-3">
                        <div className="flex items-start gap-2">
                           <Bot className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                           <div className="p-2 rounded-lg bg-secondary/10 max-w-xs">
                                <p className="text-sm">{initialMessage}</p>
                                {hasIncompleteTasks && (
                                    <div className="flex flex-col gap-2 mt-3">
                                        <Button size="sm" onClick={onInfuseTasks}>Infuse Incomplete Tasks</Button>
                                        <Button size="sm" variant="outline" onClick={onReplan}>Re-plan with AI</Button>
                                    </div>
                                )}
                           </div>
                        </div>

                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'ai' && <Bot className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />}
                                <div className={`p-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-primary/20' : 'bg-secondary/10'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.sender === 'user' && <User className="w-5 h-5 text-primary flex-shrink-0 mt-1" />}
                            </div>
                        ))}
                         {loading && (
                            <div className="flex justify-start">
                                <Bot className="w-5 h-5 text-secondary animate-spin" />
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
                 <div className="p-2 border-t border-secondary/20">
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask for advice or feedback..."
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            className="pr-10 bg-background/50 text-sm"
                            rows={1}
                            disabled={loading}
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={loading} className="absolute right-1.5 bottom-1 h-7 w-7"><CornerDownLeft className="w-4 h-4" /></Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};