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
  "Even a genius needs to practice. – Roronoa Zoro (One Piece)",
    "There’s no such thing as a painless lesson. They just don’t exist in this world. – Gray Fullbuster (Fairy Tail)",
    "Hard work is worthless for those that don’t believe in themselves. – Naruto Uzumaki (Naruto)",
    "If you don’t strive, you won’t arrive. – Lelouch Lamperouge (Code Geass)",
    "You can only grow if you’re willing to feel awkward and uncomfortable when you try something new. – Brian Tracy",
    "A dropout will beat a genius through hard work. – Rock Lee (Naruto)",
    "A lesson without pain is meaningless. For you cannot gain something without sacrificing something else in return. – Edward Elric (Fullmetal Alchemist)",
    "If you don’t work hard, you don’t get to eat. – Kurapika (Hunter × Hunter)",
    "Being strong isn’t just about physical strength, it’s also about emotional and mental strength. – Monkey D. Luffy (One Piece)",
    "It’s not about how many times you get knocked down, it’s about how many times you get back up. – Izuku Midoriya (My Hero Academia)",
    "If you don’t take risks, you can’t create a future! – Monkey D. Luffy (One Piece)",
    "Life is not a game of luck. If you wanna win, work hard. – Sora (No Game No Life)",
    "If you don’t like the hand that fate’s dealt you, fight for a new one. – Naruto Uzumaki (Naruto)",
    "People, who can’t throw something important away, can never hope to change anything. – Armin Arlert (Attack on Titan)",
    "Even the darkest night will end and the sun will rise. – Brook (One Piece)",
    "There is no such thing as impossible. I’ve been doing it for years. – Batman",
    "It’s not about how strong you are, it’s about how much will you endure. – Joseph Joestar (Jojo’s Bizarre Adventure)",
    "Without a goal, you can’t score. – Hinata Shoyo (Haikyuu!!)",
    "Believe in yourself… Believe in the you who believes in yourself. – Kamina (Gurren Lagann)",
    "A person grows up when he’s able to overcome hardships. – Jiraiya (Naruto)",
    "When you give up, that’s when the game is over. – Mitsuyoshi Anzai (Slam Dunk)",
    "Fear is not evil. It tells you what weakness is. And once you know your weakness, you can become stronger… – Gildarts Clive (Fairy Tail)",
    "A strong person does not need a reason to help others. – Madara Uchiha (Naruto)",
    "Those who have talent are truly blessed, but talent alone doesn’t make you a genius. – Erza Scarlet (Fairy Tail)",
    "To truly succeed, you must first believe that you can. – Rin Tohsaka (Fate/stay night)",
    "It’s not bad to doubt. Doubt is a sign that your mind is expanding. – Eru Chitanda (Hyouka)",
    "Knowledge is power, but only if you have the will to use it. – Horikita Suzune (Classroom of the Elite)",
    "The value of education lies not in the information it provides, but in the skills it teaches. – Ayanokouji Kiyotaka (Classroom of the Elite)",
    "No dream is too big to achieve if you’re willing to put in the effort and stay committed. – Yotsuba Nakano (The Quintessential Quintuplets)",
    "Don’t cry because it’s over, smile because it happened. – Dr. Seuss",
    "The difference between a novice and a master is that a master has failed more times than a novice had tried. – Koro-Sensei (Assassination Classroom)",
    "When you lose sight of your path, listen for the destination in your heart. – Allen Walker (D.Gray-man)",
    "The moment you think of giving up, think of the reason why you held on so long. – Natsu Dragneel (Fairy Tail)",
    "Don’t give up — there’s no shame in falling down! True shame is to not stand up again! – Shintaro Midorima (Kuroko no Basket)",
    "When you convince yourself you can’t do anymore, you’re finished… – Yomikawa Aiho (World Trigger)",
    "If you feel yourself hitting up against your limit, remember why you started… let that memory carry you beyond your limit. – All Might (My Hero Academia)",
    "The ones who accomplish something are the fools who keep pressing onward… – Celica Arfonia (Rokudenashi Majutsu Koushi…)",
    "You can’t sit around envying other people’s worlds. You have to go out and change your own. – Shinichi Chiaki (Nodame Cantabile)",
    "You can’t win a game by doing nothing… life is the same way. – Junichirou Kagami (Denpa Kyoushi)",
    "Do not think about other things, there is only one thing you can do… master that one thing. – Archer (Fate series)",
    "Hard work betrays none, but dreams betray many. – Hachiman Hikigaya (My Teen Romantic Comedy SNAFU)",
    "If you don’t like your destiny, don’t accept it… have the courage to change it. – Naruto Uzumaki (Naruto)",
    "Nothing teaches discipline like pain. – (Attack on Titan)",
    "If you win, you live. If you lose, you die. If you don’t fight, you can’t win. – Eren Yeager (Attack on Titan)",
    "The world is merciless, but it’s also very beautiful. – Mikasa Ackerman / Levi Ackerman (Attack on Titan)",
    "The only thing we are allowed to do is believe that we won’t regret the choice we made. – Levi Ackerman (Attack on Titan)",
    "You don’t die for your friends. You live for them! – Erza Scarlet (Fairy Tail)",
    "Being weak is nothing to be ashamed of. Staying weak is. – Lucy Heartfilia (Fairy Tail)",
    "It is always by way of pain one arrives at pleasure. – Grelle Sutcliffe (Black Butler)",
    "If you’ve got time to fantasize about a beautiful death, why not live beautifully until the end? – Gintoki Sakata (Gintama)",
    "Power comes in response to a need, not a desire. You have to create that need. – Goku (Dragon Ball Z)",
    "Even if I die, you keep living alright? Live to see the end… – Rei Ayanami (Neon Genesis Evangelion)",
    "I will take a potato chip… and eat it! – Light Yagami (Death Note)",
    "I want to be the one to walk in the sun. I want to be free! – Madoka Kaname (Puella Magi Madoka Magica)",
    "No matter how far apart we are, we will always be under the same sky. – Kousei Arima (Your Lie in April)",
    "If you don’t share someone’s pain, you can never understand them. – Nagato Uzumaki (Naruto)",
    "People become stronger because they have memories they can’t forget. – Tsunade (Naruto)",
    "If you don’t stand up for what you believe in, then nobody else will. – Kira Yoshikage (JoJo’s Bizarre Adventure)",
    "The only way to truly escape the mundane is for you to constantly be evolving. – Izaya Orihara (Durarara!!)",
    "When what you’re seeing isn’t real, don’t forget what you felt when you saw it. – Madoka Kaname (Puella Magi Madoka Magica)",
    "People die when they are killed. That’s what death is. – Erwin Smith (Attack on Titan)",
    "You might lose something, but the memory stays. – Ken Kaneki (Tokyo Ghoul)",
    "I refuse to let my fear control me anymore. – Maka Albarn (Soul Eater)",
    "Sometimes it’s necessary to do unnecessary things. – Kanade Jinguuji",
    "Fools who don’t respect the past are likely to repeat it. – Nico Robin (One Piece)",
    "Sometimes I do feel like I’m a failure… but even so, I’m not gonna give up. Ever! – Izuku Midoriya (My Hero Academia)",
    "If you can’t do something, then don’t. Focus on what you can do. – Shiroe (Log Horizon)",
    "We can’t waste time worrying about the what if’s. – Ichigo Kurosaki (Bleach)",
    "Don’t beg for things. Do it yourself, or else you won’t get anything. – Renton Thurston (Eureka Seven)",
    "In the ninja world… those who abandon their comrades are worse than scum. – Obito Uchiha (Naruto)",
    "People die when they are killed. – Shirou Emiya (Fate series)",
    "Trying to knock others down a peg just means lowering yourself… – Arata Kaizaki (ReLIFE)",
    "Winning is everything in the world. No matter what I have to sacrifice. – Ayanokouji Kiyotaka (Classroom of the Elite)",
    "Stop pitying yourself. Pity yourself, and life becomes an endless nightmare. – Osamu Dazai (Bungo Stray Dogs)",
    "All human are nothing but tools. As long as I win in the end… – Ayanokoji (Classroom of the Elite)",
    "Surrender is an outcome far worse than defeat. – Vegeta (Dragon Ball Super)",
    "Succeed by outworking everyone… Hard work betrays none. – Hachiman Hikigaya (My Teen Romantic Comedy SNAFU)",
    "I won’t run away anymore… that is my ninja way! – Naruto Uzumaki (Naruto)",
    "Talent is something you make bloom, instinct is something you polish. – Oikawa Toru (Haikyuu!!)",
    "A person who cannot sacrifice everything, cannot change anything. – Armin Arlert (Attack on Titan)",
    "When life changes to be harder, change yourself to be stronger. – Sora (No Game No Life)",
    "Like I always say: can't find a door? Make your own. – Edward Elric (Fullmetal Alchemist)",
    "When you hit the point of no return, that’s the moment it truly becomes a journey. – Goku (Dragon Ball Super)",
    "Human strength lies in the ability to change yourself. – Saitama (One Punch Man)",
    "Master just one thing; perfect that one skill until nothing else matters. – Hattori Hanzo (Samurai Champloo)",
    "Even if the most unworthy will not die easily. – Kisuke Urahara (Bleach)",
    "A wish can be something that will never come true the moment you tell someone else about it… – Kaiki Deishu (Monogatari)",
    "Soul needs purpose… I kill everyone besides myself, I felt alive. – Gaara (Naruto)",
    "Know your place. – Sukuna (Jujutsu Kaisen)",
    "The only thing we’re allowed to do is believe. We can’t change anything. – Akane Tsunemori (Psycho-Pass)",

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
  "Don't be afraid to give up the good to go for the great.",
  "Deadline approaching: PANIC or PERFORM?",

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