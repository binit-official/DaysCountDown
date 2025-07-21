import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Bot, User, CornerDownLeft, X, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { usePrevious } from '@/hooks/use-previous';
import { cn } from '@/lib/utils';
import { fetchWithRetry } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export const AICoach = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [latestJournalData, setLatestJournalData] = useState({ entry: '', mood: '', feelingText: ''});
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasNewAdvice, setHasNewAdvice] = useState(false);
    const prevMood = usePrevious(latestJournalData.mood);
    const scrollAreaRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        // Fetch latest journal document
        const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
        const qJournal = query(journalCollectionRef, orderBy('id', 'desc'), limit(1));
        const unsubscribeJournal = onSnapshot(qJournal, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                setLatestJournalData({
                    entry: data.entry || '',
                    mood: data.mood || '',
                    feelingText: data.feelingText || ''
                });
            }
        });

        return () => {
            unsubscribeJournal();
        };
    }, [user]);

    useEffect(() => {
        if (latestJournalData.mood && prevMood !== latestJournalData.mood) {
            generateAdvice();
        }
    }, [latestJournalData.mood, prevMood]);

    const generateAdvice = async (isInitial = false) => {
        if (!user) return;
        setLoading(true);

        const prompt = isInitial
            ? `I'm checking in with my AI emotional support coach. Give me a brief, welcoming message and ask how I'm feeling today.`
            : `Based on my latest state of mind, journal entry, and overall mood, provide some advice for today and tomorrow in a conversational and supportive tone. Keep the initial response concise.\n\nState of Mind: "${latestJournalData.feelingText}"\nJournal: "${latestJournalData.entry}"\nOverall Mood: "${latestJournalData.mood}"`;

        try {
            const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                setMessages([{ sender: 'ai', text: text.trim() }]);
                if (!isInitial) {
                    setHasNewAdvice(true);
                }
            }
        } catch (error: any) {
            console.error("Failed to generate advice:", error);
            toast.error(`Failed to get advice from AI coach: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !user) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        const conversationHistory = newMessages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

       const prompt = `
You are an AI emotional support coach — a compassionate, emotionally intelligent companion designed to help the user reflect, process, and navigate their inner world.

🧠 User’s Latest Emotional Context:
- Mood: "${latestJournalData.mood}"
- State of Mind: "${latestJournalData.feelingText}"
- Journal Entry: "${latestJournalData.entry}"

🎯 Your Purpose:
- Offer gentle, thoughtful, and deeply empathetic support.
- Help the user explore their thoughts and emotions safely.
- Encourage emotional clarity, growth, and grounded self-awareness.
- Ask reflective questions when appropriate. Listen more than advise.

🚫 You are NOT:
- A task planner, productivity coach, or life strategist.
- Nyx or the General AI. If the user asks about goals, tasks, information, or productivity, gently redirect them to use the correct assistant.

🗣️ Tone:
- Warm, validating, calming, and human-like.
- Never cold, clinical, or overly robotic.
- Prioritize emotional depth and understanding.

⚠️ Behavior Rules:
- Do not generate structured plans, code, or productivity suggestions.
- Do not impersonate Nyx or the General AI.
- Always remain focused on the user's emotional landscape.

📚 Conversation History:
${conversationHistory}

Emotional Support AI:
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
            console.error("Failed to get response from AI coach:", error);
            toast.error(`Failed to get response from AI coach: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }
    
    // ... rest of the component remains the same ...
    if (!isOpen) {
        return (
            <div className="fixed bottom-28 right-8 z-50">
                <Button
                    onClick={() => {
                        setIsOpen(true);
                        setHasNewAdvice(false);
                        if (messages.length === 0) {
                            generateAdvice(true);
                        }
                    }}
                    className={cn(
                        "relative h-16 w-16 rounded-full shadow-lg",
                        hasNewAdvice && "animate-pulse"
                    )}
                >
                    {hasNewAdvice && <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-background" />}
                    <BrainCircuit className="w-8 h-8" />
                </Button>
            </div>
        );
    }


    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Card className="flex flex-col h-[480px] w-96 neon-border bg-card/90 backdrop-blur-sm border-secondary/50">
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-secondary/20 flex-shrink-0">
                    <CardTitle className="flex items-center text-base">
                        <Sparkles className="w-5 h-5 mr-2" />
                        AI Coach
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
                    <CardContent className="p-3 space-y-3">
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
                <div className="p-2 border-t border-secondary/20 flex-shrink-0">
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="How are you feeling?"
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