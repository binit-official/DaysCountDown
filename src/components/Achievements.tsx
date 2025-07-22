import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Award, Zap, Flame, Target, Star, BrainCircuit, BookOpen, Crown, Calendar, Feather, Shield, Coffee, Sunrise, Sunset, Moon } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AchievementCard } from './AchievementCard';
import { ScrollArea, ScrollBar } from './ui/scroll-area'; // Import ScrollBar
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
  // Streaks
  { id: 'streak_3', name: 'On a Roll', description: 'Complete tasks for 3 days in a row.', icon: Flame },
  { id: 'streak_7', name: 'Week Warrior', description: 'Complete tasks for 7 days in a row.', icon: Zap },
  { id: 'streak_30', name: 'Month Master', description: 'Maintain a 30-day completion streak.', icon: Crown },
  { id: 'streak_100', name: 'Legendary', description: 'Achieve an unbelievable 100-day streak.', icon: Star },
  
  // Mission Completion
  { id: 'mission_1', name: 'First Step', description: 'Successfully complete your first mission.', icon: Target },
  { id: 'mission_5', name: 'Serial Achiever', description: 'Successfully complete 5 missions.', icon: Award },
  { id: 'mission_10', name: 'Goal Getter', description: 'Successfully complete 10 missions.', icon: Award },
  { id: 'mission_25', name: 'Dominator', description: 'Successfully complete 25 missions.', icon: Crown },

  // Difficulty & Priority
  { id: 'extreme_1', name: 'Daredevil', description: 'Complete a mission with EXTREME priority.', icon: Shield },
  { id: 'challenge_task_1', name: 'Challenger', description: 'Complete a "Challenge" difficulty daily task.', icon: Award },
  
  // Study Time
  { id: 'study_1_hour', name: 'Focused Mind', description: 'Log your first hour of study time.', icon: BrainCircuit },
  { id: 'study_10_hours', name: 'Deep Worker', description: 'Log a total of 10 hours of study time.', icon: BookOpen },
  { id: 'study_50_hours', name: 'Time Scholar', description: 'Log a total of 50 hours of study time.', icon: Coffee },
  { id: 'study_marathon', name: 'Marathon Session', description: 'Log a single study session of over 2 hours.', icon: Zap },

  // Feature Usage
  { id: 'journal_1', name: 'First Thoughts', description: 'Write your first journal entry.', icon: Feather },
  { id: 'journal_7_days', name: 'Diarist', description: 'Write a journal entry for 7 different days.', icon: BookOpen },
  { id: 'mood_10_logs', name: 'Mood Mapper', description: 'Log your mood 10 times.', icon: Zap },
  { id: 'roadmap_30_days', name: 'Planner', description: 'Generate a roadmap for 30 days or more.', icon: Calendar },
  { id: 'feedback_1', name: 'Adapt & Overcome', description: 'Use the AI feedback feature to adapt your plan.', icon: BrainCircuit },

  // Consistency
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a task before 8 AM.', icon: Sunrise },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a task after 10 PM.', icon: Moon },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Complete all tasks for 7 consecutive days.', icon: Star },
];

interface AchievementsProps {
  unlockedAchievements: string[];
}

export const Achievements = ({ unlockedAchievements }: AchievementsProps) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  return (
    <Dialog>
      <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
        <h3 className="text-lg font-bold mb-4 neon-text">Achievements</h3>
        <TooltipProvider>
          {/* FIX: Changed to a horizontal scroll area */}
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-4 pb-4">
              {ALL_ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                const content = (
                  <div
                    className={`flex items-center justify-center rounded-lg border aspect-square transition-all duration-300 w-20 h-20 ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-primary/30 to-accent/30 border-primary/50 text-primary scale-100 shadow-lg shadow-primary/20 cursor-pointer hover:scale-105'
                        : 'bg-muted/50 border-muted/50 text-muted-foreground'
                    }`}
                  >
                    <ach.icon className="w-10 h-10" />
                  </div>
                );

                return (
                  <Tooltip key={ach.id}>
                    <TooltipTrigger asChild>
                      {isUnlocked ? (
                        <DialogTrigger asChild onClick={() => setSelectedAchievement(ach)}>
                          {content}
                        </DialogTrigger>
                      ) : (
                        content
                      )}
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
            {/* FIX: Added the horizontal scrollbar component */}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TooltipProvider>
      </Card>
      <DialogContent className="p-0 border-0 bg-transparent w-auto">
        <AchievementCard achievement={selectedAchievement} />
      </DialogContent>
    </Dialog>
  );
};