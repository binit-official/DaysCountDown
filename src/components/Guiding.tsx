import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
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

export const Guiding = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [latestJournalData, setLatestJournalData] = useState({ entry: '', moods: [], feelings: [] });
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasNewAdvice, setHasNewAdvice] = useState(false);
    const prevJournalData = usePrevious(latestJournalData);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
        const qJournal = query(journalCollectionRef, orderBy('__name__', 'desc'), limit(1));

        const unsubscribeJournal = onSnapshot(qJournal, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                const newData = {
                    entry: data.entry || '',
                    moods: data.moods || [],
                    feelings: data.feelings || []
                };
                setLatestJournalData(newData);
            }
        });

        return () => unsubscribeJournal();
    }, [user]);

    useEffect(() => {
        // Check if there's new, meaningful data to trigger advice
        const hasNewMoods = latestJournalData.moods.length > (prevJournalData?.moods.length ?? 0);
        const hasNewFeelings = latestJournalData.feelings.length > (prevJournalData?.feelings.length ?? 0);
        const hasNewEntry = latestJournalData.entry && latestJournalData.entry !== prevJournalData?.entry;

        if (hasNewMoods || hasNewFeelings || hasNewEntry) {
             setHasNewAdvice(true);
        }
    }, [latestJournalData, prevJournalData]);


    const generateInitialGuide = async () => {
        if (!user || (!latestJournalData.entry && latestJournalData.moods.length === 0 && latestJournalData.feelings.length === 0)) {
            setMessages([{ sender: 'ai', text: "Hello! I'm here to offer some guidance. How are you feeling today? You can write in your journal or log your state of mind to get started." }]);
            return;
        }

        setLoading(true);
        const moodsText = latestJournalData.moods.map((m: any) => m.mood).join(', ');
        const feelingsText = latestJournalData.feelings.map((f: any) => `"${f.text}"`).join(', ');

        const prompt = `
        You are an AI emotional support coach named "Guiding". Your role is to help the user with their emotional state and well-being.
        Based on the user's latest journal data below, generate a thoughtful and supportive opening message.

        Your response should:
        1.  Briefly summarize or reflect on their logged feelings and journal entry.
        2.  Offer a piece of gentle, actionable advice or a comforting perspective.
        3.  End with an open-ended question like "How does that sound?" or "Is there anything specific on your mind you'd like to explore further?".

        Keep your tone conversational, empathetic, and supportive.

        User's Data:
        - Moods Logged: "${moodsText || 'None'}"
        - State of Mind Entries: ${feelingsText || 'None'}
        - Journal Entry: "${latestJournalData.entry || 'None'}"
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
                setMessages([{ sender: 'ai', text: text.trim() }]);
            }
        } catch (error: any) {
            console.error("Failed to generate initial guide:", error);
            setMessages([{ sender: 'ai', text: `I'm having a little trouble connecting right now, but I'm here for you. How are you doing?` }]);
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
        const moodsText = latestJournalData.moods.map((m: any) => m.mood).join(', ');
        const feelingsText = latestJournalData.feelings.map((f: any) => `"${f.text}"`).join(', ');

        const prompt = `You are an AI emotional support coach called "Guiding". Your role is to help the user with their emotional state and well-being.
        The user's states of mind today have been: ${feelingsText}, their journal entry is: "${latestJournalData.entry}", and their moods today have been: "${moodsText}".
        Keep your responses supportive and focused on emotional well-being.
        If the user asks for general information, planning, or anything not related to emotional support, gently redirect them to use the "Nyx" or "General AI" assistants.
        Conversation history:
        ${conversationHistory}
        Guiding:`;

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
            console.error("Failed to get response from Guiding:", error);
            toast.error(`Failed to get response from Guiding: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    const handleOpen = () => {
        setIsOpen(true);
        setHasNewAdvice(false);
        // Generate the guide only when opening the chat window.
        generateInitialGuide();
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-28 right-8 z-50">
                <Button
                    onClick={handleOpen}
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
                        Guiding
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
                            placeholder="Share what's on your mind..."
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