import { useState, useEffect } from 'react';
import { Zap, Target, Clock, Flame } from 'lucide-react';

const mockingQuotes = [
  "Still scrolling? That's why you're still here.",
  "Your goals called. They went to voicemail. Again.",
  "Dreams don't have deadlines? Yours should. NOW.",
  "Comfort zone population: Just you. Forever.",
  "Tomorrow's excuse is already loading...",
  "Procrastination level: LEGENDARY. Congratulations.",
  "Your future self is writing your resignation letter.",
  "Success knocked. You were too busy 'planning' to answer.",
  "Mediocrity loves you back. That's the problem.",
  "Time doesn't wait. Your dreams are getting impatient.",
  "Your competition finished while you were 'thinking'.",
  "Every wasted second is a victory for your competition.",
  "Goals without deadlines are fantasies. Wake up.",
  "The grind doesn't care about your feelings. Neither should you.",
  "Stop perfecting the plan. Start executing the mess.",
  "Your excuses expired yesterday. What's today's?",
  "Motivation is for beginners. Discipline is for winners.",
  "The clock is mocking you. Can you hear it?",
  "Comfort is the enemy. You're best friends.",
  "Winners don't negotiate with the snooze button.",
  "Your dreams are on life support. Be the doctor.",
  "Time is money. You're going bankrupt.",
  "Champions were beginners who refused to stay beginners.",
  "The hardest part? You haven't started yet.",
  "Yesterday's you is laughing at today's excuses.",
  "Your potential is screaming. You're wearing earplugs.",
  "Success is uncomfortable. Get used to it.",
  "Failure is comfortable. Stop getting comfortable.",
  "Your goals are not suggestions. They're demands.",
  "Deadline approaching: PANIC or PERFORM?"
];

export const MotivationalQuote = () => {
  const [currentQuote, setCurrentQuote] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    // Get today's quote based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % mockingQuotes.length;
    
    setQuoteIndex(index);
    setCurrentQuote(mockingQuotes[index]);
  }, []);

  useEffect(() => {
    // Change quote every 8 seconds for demo purposes
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % mockingQuotes.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentQuote(mockingQuotes[quoteIndex]);
  }, [quoteIndex]);

  const icons = [Zap, Target, Clock, Flame];
  const IconComponent = icons[quoteIndex % icons.length];

  return (
    <div className="relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-neon opacity-15 blur-3xl"></div>
      
      <div className="relative neon-border rounded-xl p-4 md:p-6 bg-card/90 backdrop-blur-sm slide-in border-accent/50">
        <div className="flex items-start space-x-3 md:space-x-4">
          <div className="flex-shrink-0">
            <div className="p-2 md:p-3 rounded-full bg-primary/30 neon-border pulse-glow">
              <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-xs md:text-sm text-accent font-black uppercase tracking-widest mb-2 md:mb-3">
              BRUTAL REALITY CHECK
            </div>
            
            <blockquote className="text-base md:text-xl font-bold leading-tight md:leading-relaxed">
              <span className="text-primary font-black text-xl md:text-3xl">"</span>
              <span className="gradient-text font-black text-base md:text-xl">
                {currentQuote}
              </span>
              <span className="text-primary font-black text-xl md:text-3xl">"</span>
            </blockquote>
            
            <div className="mt-3 md:mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-semibold">
                Harsh Truth #{(quoteIndex + 1).toString().padStart(3, '0')} / {mockingQuotes.length}
              </div>
              
              <div className="flex space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i === quoteIndex % 4 
                        ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]' 
                        : 'bg-muted/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Pulsing aggressive border */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-red-500/20 opacity-30 blur-sm -z-10 animate-pulse"></div>
        
        {/* Corner accent */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse opacity-60"></div>
      </div>
    </div>
  );
};