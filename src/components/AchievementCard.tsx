import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Achievement } from './Achievements';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from './Logo';

interface AchievementCardProps {
  achievement: Achievement | null;
}

export const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  if (!achievement) return null;

  const handleDownload = () => {
    if (cardRef.current === null) return;

    toPng(cardRef.current, { cacheBust: true, backgroundColor: 'hsl(var(--background))' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `dcd-achievement-${achievement.id}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to create image', err);
      });
  };
  
  return (
    <div>
      <div ref={cardRef} className="p-8 bg-gradient-to-br from-card to-background border border-primary/20">
        <div className="flex flex-col items-center text-center text-foreground">
          <div className="p-4 bg-primary/20 rounded-full border-2 border-primary mb-6 shadow-lg shadow-primary/30">
            <achievement.icon className="w-16 h-16 text-primary" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">ACHIEVEMENT UNLOCKED</p>
          <h2 className="text-4xl font-black my-2 neon-text">{achievement.name}</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">{achievement.description}</p>
          <div className="w-24 h-px bg-border my-8"></div>
          <p className="font-bold text-xl">{user?.displayName || 'An Achiever'}</p>
          <p className="text-xs text-muted-foreground">has earned this on Days Count Down</p>
          <Logo className="mt-6 opacity-50" />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Button onClick={handleDownload} className="cyberpunk-button">
          <Download className="mr-2" />
          Download as Image
        </Button>
      </div>
    </div>
  );
};