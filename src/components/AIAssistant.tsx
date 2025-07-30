import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Bot, User, CornerDownLeft, Zap, Wind, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { fetchWithFallback } from '@/lib/utils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY_2 = import.meta.env.VITE_GEMINI_API_KEY_2;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

interface AIAssistantProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    isOtherAssistantOpen: boolean;
    missions: any[];
    currentRoadmap: any;
    hasIncompleteTasks: boolean;
    allTasksCompleted: boolean;
    currentDay: number;
    onInfuseTasks: () => void;
    onReplan: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
    isOpen,
    onOpenChange,
    isOtherAssistantOpen,
    missions,
    currentRoadmap,
    hasIncompleteTasks,
    allTasksCompleted,
    currentDay,
    onInfuseTasks,
    onReplan,
}) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newUserMessage = { role: 'user' as const, text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setLoading(true);

        const safeMissions = missions?.map(m => `"${m.title || 'Untitled Mission'}" with priority ${m.priority || 'N/A'}`).join(', ') || 'None';
        const safeGoal = currentRoadmap?.goal || 'None defined';
        const safeProgress = currentRoadmap ? `Day ${currentRoadmap.day || currentDay || 1} of ${currentRoadmap.days || 'N/A'}` : 'No roadmap active';
        const safeStatus = hasIncompleteTasks ? 'Falling behind on some tasks.' : 'On track.';

        const contextPrompt = `
            You are Nyx, a tough-but-fair AI accountability coach with a cyberpunk theme. You are direct, sharp, and focused on helping the user achieve their goals. You can also handle general conversation, but always bring it back to the user's objectives.

            Here is the user's current status:
            - Active Missions: ${safeMissions}
            - Current Roadmap Goal: "${safeGoal}"
            - Progress: ${safeProgress}
            - Status: ${safeStatus}

            Previous conversation with you (Nyx):
            ${messages.map(m => `${m.role}: ${m.text}`).join('\n')}
            
            User's new message: "${input}"

            Based on all this context, provide a response that is in character. Be direct, ask clarifying questions, and push the user to stay on target. If they are making excuses, call them out. If they are doing well, give them a sharp, concise nod of approval.
        `;
        
        if (!contextPrompt.trim()) {
            toast.error("Could not send message: context is missing.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetchWithFallback(
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
                throw new Error(data.error?.message || "Model response was empty.");
            }

        } catch (error: any) {
            toast.error(`Nyx is unavailable: ${error.message}`);
            setInput(input);
            setMessages(prev => prev.filter(m => m !== newUserMessage));
        } finally {
            setLoading(false);
        }
    };
    
    const QuickActionButton: React.FC<{ Icon: React.ElementType, text: string, onClick: () => void }> = ({ Icon, text, onClick }) => (
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onClick}>
            <Icon className="h-4 w-4 text-primary" />
            {text}
        </Button>
    );

    return (
        <>
            {!isOtherAssistantOpen && (
                <div className="fixed bottom-4 right-4 z-50">
                    <Button onClick={() => onOpenChange(!isOpen)} size="icon" className="rounded-full w-16 h-16 shadow-lg shadow-primary/30">
                        <Bot className="h-8 w-8" />
                    </Button>
                </div>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 right-4 z-[60]"
                    >
                        <Card className="w-96 neon-border bg-background/80 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><Bot /> Nyx</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 overflow-y-auto space-y-4 pr-2">
                                    {messages.length === 0 && (
                                        <div className="text-sm text-muted-foreground space-y-4">
                                            <p>Report status or ask for a new plan.</p>
                                            {hasIncompleteTasks && <QuickActionButton Icon={Wind} text="Infuse missed tasks" onClick={onInfuseTasks} />}
                                            {currentRoadmap && <QuickActionButton Icon={Zap} text="Re-plan with AI" onClick={onReplan} />}
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'model' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {msg.text}
                                            </div>
                                            {msg.role === 'user' && <User className="h-5 w-5 flex-shrink-0" />}
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center gap-2">
                                                 <Bot className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
                                                 <span className="text-xs text-muted-foreground">Nyx is processing...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Report status..."
                                        className="flex-grow"
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        disabled={loading}
                                    />
                                    <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
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