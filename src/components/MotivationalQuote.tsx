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
<<<<<<< HEAD
  "Deadline approaching: PANIC or PERFORM?",
  "That 'one day' you're waiting for is today. The clock is ticking.",
  "Are you busy or just busy making excuses?",
  "The distance between your dreams and reality is called action. You're standing still.",
  "Stop being impressed by what you could do and start being judged by what you did.",
  "Your comfort zone is a graveyard for your ambitions.",
  "The work is going to get done. The only question is whether you'll be the one to do it.",
  "You don't lack time, you lack discipline.",
  "Regret is heavier than the weight of discipline. Choose wisely.",
  "Is your 'research' phase just a fancy word for procrastination?",
  "The world doesn't owe you anything. It was here first.",
  "Stop waiting for the perfect moment. It doesn't exist. Start now.",
  "Your potential is a weapon. Stop leaving it in the holster.",
  "Be the person your excuses are afraid of.",
  "The only thing stopping you is the story you keep telling yourself.",
  "Pain is temporary. Quitting is forever.",
  "You're not tired. You're uninspired. Do the work.",
  "Don't just count the days. Make the days count.",
  "The version of you that you're proud of is on the other side of this task.",
  "Stop romanticizing the grind and just grind.",
  "Your feelings are liars. The results aren't.",
  "That task you're avoiding? It's the one you need to do most.",
  "You can have results or excuses. Not both.",
  "The clock won't stop for your doubts. Keep moving.",
  "Someone, somewhere, is working harder than you. And they're winning.",
  "Don't lower the goal. Increase the effort.",
  "If it was easy, everyone would do it. That's why they don't.",
  "Your future is created by what you do today, not tomorrow.",
  "Stop looking for a shortcut. The long way is the only way.",
  "Discipline is the bridge between goals and accomplishment. Start building.",
  "You're not 'stuck'. You're just not committed enough.",
  "The price of success is hard work. The price of regret is much higher.",
  "That's a nice plan you have there. It'd be a shame if you never started it.",
  "The only workout you regret is the one you didn't do.",
  "Execute. The world has enough 'idea people'.",
  "Are you writing your legacy or your list of excuses?",
  "The longer you wait, the harder it gets. Do it now.",
  "Your brain will always choose comfort. Override it.",
  "Success isn't owned. It's leased. And rent is due every day.",
  "Stop negotiating with your weakness.",
  "Be obsessed or be average.",
  "The difference between who you are and who you want to be is what you do.",
  "Don't tell people your plans. Show them your results.",
  "It's you against you. Don't lose.",
  "The work isn't glamorous. The results are.",
  "Your excuses are seducers. Your goals are liberators.",
  "Feel the fear and do it anyway.",
  "The perfect setup doesn't exist. The perfect effort does.",
  "Stop being a fan of your own potential.",
  "Greatness is a daily choice.",
  "You are what you do, not what you say you'll do.",
  "The mirror is your only competition.",
  "Stop looking for the magic pill. It's called discipline.",
  "Your goals don't care how you feel.",
  "Break it down and get it done. Stop overthinking.",
  "The person you will be in five years is based on the books you read and the people you associate with today.",
  "It’s not who you are that holds you back, it’s who you think you’re not.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You are the CEO of your life. Start making executive decisions.",
  "The pain you feel today is the strength you feel tomorrow.",
  "Don’t wish for it. Work for it.",
  "If you’re the smartest person in the room, you’re in the wrong room.",
  "The secret of getting ahead is getting started.",
  "Do something today that your future self will thank you for.",
  "What you do every day matters more than what you do once in a while.",
  "You can't cheat the grind. It knows how much you've invested.",
  "The question isn’t who is going to let me; it’s who is going to stop me.",
  "The only limit to our realization of tomorrow will be our doubts of today.",
  "Don't watch the clock; do what it does. Keep going.",
  "There is no substitute for hard work.",
  "Hard work beats talent when talent doesn't work hard.",
  "The successful warrior is the average man, with laser-like focus.",
  "You miss 100% of the shots you don't take.",
  "The only way to do great work is to love what you do.",
  "Act as if what you do makes a difference. It does.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "The temptation to quit will be greatest just before you are about to succeed.",
  "Either you run the day, or the day runs you.",
  "Don't be afraid to give up the good to go for the great."
=======
  "Deadline approaching: PANIC or PERFORM?"
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
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