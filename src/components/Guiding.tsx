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
        const hasNewMoods = latestJournalData.moods.length > (prevJournalData?.moods.length ?? 0);
        const hasNewFeelings = latestJournalData.feelings.length > (prevJournalData?.feelings.length ?? 0);
        const hasNewEntry = latestJournalData.entry && latestJournalData.entry !== prevJournalData?.entry;

        if (hasNewMoods || hasNewFeelings || hasNewEntry) {
             setHasNewAdvice(true);
        }
    }, [latestJournalData, prevJournalData]);


    const generateInitialGuide = async () => {
        if (!user) return;
        
        setLoading(true);

        const moodsText = latestJournalData.moods.map((m: any) => m.mood).join(', ') || 'Not logged';
        const feelingsText = latestJournalData.feelings.map((f: any) => `"${f.text}"`).join(', ') || 'Not logged';
        const entryText = latestJournalData.entry || 'Not logged';

        // **FIX:** The prompt is now more direct and provides a fallback for the AI if no data is present.
        const prompt = `
        You are an AI emotional support coach named "Guiding". Your primary function is to provide guidance based on the user's logged emotional state.

        **Your Task:**
        Analyze the user's data provided below. Generate a thoughtful, supportive opening message that:
        1.  Directly acknowledges one or two key feelings or themes from their logs.
        2.  Offers a gentle, actionable piece of advice or a comforting perspective related to their logs.
        3.  Ends with an open-ended question like "How are you feeling about this?" or "Is there anything specific on your mind right now?".

        **User's Emotional Data for Today:**
        - **Moods Logged:** ${moodsText}
        - **State of Mind Entries:** ${feelingsText}
        - **Journal Entry:** "${entryText}"

        **IMPORTANT:**
        - If all data fields say "Not logged", simply greet the user warmly and ask how their day is going, encouraging them to share what's on their mind.
        - Do NOT say you cannot access their data. You MUST use the data provided above.
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
            } else {
                 throw new Error("No text returned from API.");
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
        const moodsText = latestJournalData.moods.map((m: any) => m.mood).join(', ') || 'Not logged';
        const feelingsText = latestJournalData.feelings.map((f: any) => `"${f.text}"`).join(', ') || 'Not logged';
        const entryText = latestJournalData.entry || 'Not logged';

        // **FIX:** This prompt is also more direct.
        const prompt = `
        You are an AI emotional support coach named "Guiding". Your role is to help the user with their emotional state and well-being based on the context of their day.

        **Primary Context (User's Data for Today):**
        - **Moods Logged:** ${moodsText}
        - **State of Mind Entries:** ${feelingsText}
        - **Journal Entry:** "${entryText}"

        **Your Task:**
        Respond to the user's latest message in the conversation history below. You MUST use the primary context above to inform your response. Keep your responses supportive, empathetic, and focused on emotional well-being. If the user asks for something unrelated to emotional support (like planning or general info), gently redirect them to the "Nyx" or "General AI" assistants.

        **Conversation History:**
        ${conversationHistory}

        **Guiding's Response:**`;

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