import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Sparkles, User, CornerDownLeft, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchWithRace } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY_2 = import.meta.env.VITE_GEMINI_API_KEY_2;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";


interface SallyProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    isOtherAssistantOpen: boolean;
    journal: any[];
    moods: any;
    stats: any;
}

export const Guiding: React.FC<SallyProps> = ({ isOpen, onOpenChange, isOtherAssistantOpen, journal, moods, stats }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newUserMessage = { role: 'user' as const, text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setLoading(true);

        const contextPrompt = `
            You are Sally, a supportive and empathetic AI wellness coach. Your goal is to help the user understand their feelings and maintain mental well-being. You are kind, insightful, and encouraging.

            Here is the user's current data:
            - Recent Journal Entries (last 5): ${journal.slice(-5).map(j => `On ${j.date}: "${j.entry}"`).join('\n') || 'None'}
            - Recent Moods: ${moods?.moods?.slice(-5).map((m: any) => `${m.mood} (at ${new Date(m.timestamp?.toDate()).toLocaleString()})`).join(', ') || 'None'}
            - Recent Feelings: ${moods?.feelings?.slice(-5).map((f: any) => `${f.feeling} (at ${new Date(f.timestamp?.toDate()).toLocaleString()})`).join(', ') || 'None'}
            - Current Streak: ${stats?.streak || 0} days.

            Previous conversation with you (Sally):
            ${messages.map(m => `${m.role}: ${m.text}`).join('\n')}
            
            User's new message: "${input}"

            Based on all this context, provide a thoughtful, supportive, and helpful response.
        `;

        try {
            const response = await fetchWithRace(
                API_BASE_URL,
                GEMINI_API_KEY,
                GEMINI_API_KEY_2,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: contextPrompt }] }] }),
                }
            );

            const data = await response.json();
            const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (modelResponse) {
                setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
            } else {
                throw new Error("Model response was empty.");
            }

        } catch (error: any) {
            toast.error(`Sally is unavailable: ${error.message}`);
            setInput(input);
            setMessages(prev => prev.filter(m => m !== newUserMessage));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!isOtherAssistantOpen && (
                 <div className="fixed bottom-4 left-4 z-50">
                    <Button onClick={() => onOpenChange(true)} size="icon" className="rounded-full w-16 h-16 shadow-lg shadow-secondary/30 bg-secondary hover:bg-secondary/90">
                        <Sparkles className="h-8 w-8" />
                    </Button>
                </div>
            )}
           
            <AnimatePresence>
                {isOpen && (
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-4 z-[60]"
                    >
                        <Card className="w-96 neon-border-secondary bg-background/80 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Sparkles /> Sally</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 overflow-y-auto space-y-4 pr-2">
                                     {messages.length === 0 && (
                                        <div className="text-sm text-muted-foreground space-y-4">
                                            <p>How are you feeling today? Talk to me about anything on your mind.</p>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'model' && <Sparkles className="h-5 w-5 text-secondary flex-shrink-0" />}
                                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
                                                {msg.text}
                                            </div>
                                            {msg.role === 'user' && <User className="h-5 w-5 flex-shrink-0" />}
                                        </div>
                                    ))}
                                     {loading && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center gap-2">
                                                 <Sparkles className="h-5 w-5 text-secondary flex-shrink-0 animate-pulse" />
                                                 <span className="text-xs text-muted-foreground">Sally is listening...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Share your thoughts..."
                                        className="flex-grow"
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        disabled={loading}
                                    />
                                    <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" variant="secondary">
                                        <CornerDownLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};