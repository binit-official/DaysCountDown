// src/components/Achievements.tsx

import React from 'react';
import { Card } from '@/components/ui/card';
import { Award, Zap, Flame, Target, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'streak_3', name: 'On a Roll', description: 'Complete tasks for 3 days in a row.', icon: Flame },
  { id: 'streak_7', name: 'Week Warrior', description: 'Complete tasks for 7 days in a row.', icon: Zap },
  { id: 'mission_1', name: 'First Mission', description: 'Successfully complete your first mission.', icon: Target },
  { id: 'mission_5', name: 'Serial Achiever', description: 'Successfully complete 5 missions.', icon: Star },
  { id: 'extreme_1', name: 'Daredevil', description: 'Complete a mission with EXTREME priority.', icon: Award },
];

interface AchievementsProps {
  unlockedAchievements: string[];
}

export const Achievements = ({ unlockedAchievements }: AchievementsProps) => {
  return (
    <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4 neon-text">Achievements</h3>
      <TooltipProvider>
        <div className="grid grid-cols-5 gap-4">
          {ALL_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            return (
              <Tooltip key={ach.id}>
                <TooltipTrigger asChild>
                  <div className={`flex items-center justify-center p-3 rounded-lg border ${
                      isUnlocked 
                        ? 'bg-primary/20 border-primary/50 text-primary' 
                        : 'bg-muted/50 border-muted/50 text-muted-foreground'
                    }`}
                  >
                    <ach.icon className="w-6 h-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">{ach.name}</p>
                  <p>{ach.description}</p>
                  {!isUnlocked && <p className="text-xs text-muted-foreground">(Locked)</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </Card>
  );
};