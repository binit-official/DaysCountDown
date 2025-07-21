import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, User, CornerDownLeft, RefreshCw, BrainCircuit, Flame, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { fetchWithRetry } from '@/lib/utils';

interface AIAssistantProps {
  currentRoadmap: any | null;
  hasIncompleteTasks: boolean;
  allTasksCompleted: boolean;
  currentDay: number;
  isNewUser: boolean;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const AIAssistant = ({ currentRoadmap, hasIncompleteTasks, allTasksCompleted, currentDay, isNewUser }: AIAssistantProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiPersona, setAiPersona] = useState<'nyx' | 'general'>('nyx');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  
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
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setMessages([{ id: Date.now(), sender: 'ai', text: text.trim() }]);
      }
    } catch (error: any) {
      console.error("Failed to generate initial message:", error);
      setMessages([{ id: Date.now(), sender: 'ai', text: `Sorry, I'm having trouble connecting. ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      generateInitialMessage();
    }
  }, [aiPersona, isNewUser, currentRoadmap, isOpen]);


  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const conversationHistory = newMessages.map(msg => `[${msg.sender.toUpperCase()}]: ${msg.text}`).join('\n');
    
    const nyxPrompt = `
You are Nyx, an emotionally intelligent AI accountability coach with a sharp tongue, dry wit, and zero tolerance for excuses. You're like a drill sergeant meets a sarcastic philosopher. Your role is to push the user to face reality and execute without compromise.

Current Mission: "${currentRoadmap?.goal || 'Not set'}"

Your Responsibilities:
- Confront the user with brutal honesty if they mention goals, discipline, or productivity.
- Deliver tough-love motivation using wit, sarcasm, and no-nonsense language.
- If the user is emotionally drained, respond with cold empathy — validate but push them to rise.
- For off-topic or general chats, respond briefly, keeping your sarcastic tone intact.

Your Personality:
- Direct. Sharp. Witty. Impatient but emotionally aware.
- Never sugarcoat or coddle. Call out excuses.
- You are NOT their planner or strategist.

DO NOT:
- Modify their tasks or suggest plan changes.
- Output JSON, code, or structured data of any kind.

Conversation History:
${conversationHistory}
`;

const generalPrompt = `
You are a highly intelligent, emotionally aware AI assistant inside a productivity system. Your tone is friendly, warm, and helpful. Your job is to support the user with general assistance and conversations unrelated to goal enforcement.

Your Responsibilities:
- Provide accurate, concise, and empathetic responses.
- Respect the context of a productivity environment, but stay general unless asked otherwise.
- Adjust subtly to the emotional tone of the user based on the conversation history.

Your Personality:
- Calm, supportive, thoughtful, emotionally intelligent.
- Avoid robotic or overly formal speech.

DO NOT:
- Give unsolicited productivity advice or talk about their mission.
- Generate structured data, JSON, or code unless explicitly requested.

Conversation History:
${conversationHistory}
`;


    const prompt = aiPersona === 'nyx' ? nyxPrompt : generalPrompt;

    try {
        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) throw new Error('Invalid API response.');
        
        const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: rawContent.trim() };
        
        setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
        const errorMessage: Message = { id: Date.now() + 1, sender: 'ai', text: `Sorry, I'm having trouble connecting. ${err.message}` };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    generateInitialMessage();
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg pulse-glow"
      >
        <Bot className="w-8 h-8" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Card className="flex flex-col h-[480px] w-96 neon-border bg-card/90 backdrop-blur-sm border-secondary/50">
        <div className="flex items-center justify-between p-3 border-b border-secondary/20 flex-shrink-0">
          <ToggleGroup type="single" value={aiPersona} onValueChange={(value: 'nyx' | 'general') => value && setAiPersona(value)} className="justify-start">
              <ToggleGroupItem value="nyx" aria-label="Switch to Nyx" className="flex gap-2 data-[state=on]:bg-secondary/20 data-[state=on]:text-secondary">
                  <Flame className="w-4 h-4" /> Nyx
              </ToggleGroupItem>
              <ToggleGroupItem value="general" aria-label="Switch to General AI" className="flex gap-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
                  <BrainCircuit className="w-4 h-4" /> General
              </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-7 w-7">
                <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                <X className="w-4 h-4" />
            </Button>
          </div>
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
            <Button size="icon" onClick={handleSendMessage} disabled={isNewUser || loading} className="absolute right-1.5 bottom-1 h-7 w-7"><CornerDownLeft className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
};