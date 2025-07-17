import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  startDate: Date;
  title: string;
  onComplete?: () => void;
}

export const CountdownTimer = ({ targetDate, startDate, title, onComplete }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const start = new Date(startDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, total: difference });

        // Calculate accurate progress based on actual timespan
        const totalDuration = target - start;
        const elapsed = now - start;
        const progressPercent = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;
        setProgress(Math.max(0, progressPercent)); // Ensure progress is never negative
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        setProgress(100);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, startDate, onComplete]);

  const radius = window.innerWidth < 768 ? 100 : 150; // Responsive radius
  const strokeWidth = window.innerWidth < 768 ? 6 : 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-4 md:space-y-8 animate-countdown-pulse">
      {/* Progress Ring */}
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="hsl(var(--muted))"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="opacity-30"
          />
          {/* Progress circle */}
          <circle
            stroke="hsl(var(--primary))"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_20px_hsl(var(--primary))]"
          />
        </svg>
        
        {/* Center content - MUCH BIGGER */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl md:text-8xl lg:text-9xl font-mono font-black gradient-text drop-shadow-lg">
            {timeLeft.days}
          </div>
          <div className="text-sm md:text-lg text-muted-foreground uppercase tracking-widest font-bold">
            DAYS LEFT
          </div>
        </div>
      </div>

      {/* Title - BIGGER AND BOLDER */}
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-center neon-text max-w-4xl leading-tight">
        {title}
      </h2>

      {/* Time breakdown - Enhanced for mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full max-w-2xl px-4">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Minutes', value: timeLeft.minutes },
          { label: 'Seconds', value: timeLeft.seconds },
        ].map((item, index) => (
          <div 
            key={item.label} 
            className="text-center neon-border rounded-xl p-3 md:p-6 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="text-2xl md:text-4xl font-mono font-black text-primary mb-1">
              {item.value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status - More aggressive */}
      {timeLeft.total <= 0 && (
        <div className="text-center space-y-2 animate-pulse">
          <div className="text-accent text-3xl md:text-5xl font-black neon-text">
            TIME'S UP!
          </div>
          <div className="text-red-500 text-xl md:text-2xl font-bold">
            NO MORE EXCUSES! NO MORE TOMORROW!
          </div>
        </div>
      )}
    </div>
  );
};