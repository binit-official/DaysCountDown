import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, Target } from 'lucide-react';

interface DailyTaskCardProps {
  roadmap: any | null;
}

export const DailyTaskCard = ({ roadmap }: DailyTaskCardProps) => {
  if (!roadmap || !roadmap.dailyTasks || roadmap.dailyTasks.length === 0) {
    return null; // Don't render if there's no roadmap
  }

  // Calculate current day of the plan
  const startDate = roadmap.startDate ? (roadmap.startDate.toDate ? roadmap.startDate.toDate() : new Date(roadmap.startDate)) : new Date();
  const today = new Date();
  const currentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const todaysTask = roadmap.dailyTasks.find((task: any) => task.day === currentDay);

  return (
    <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-primary/50">
      <h3 className="text-lg font-bold mb-4 text-primary neon-text">Today's Mission (Day {currentDay})</h3>
      {todaysTask ? (
        <div className="flex items-start space-x-3">
          <Target className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
          <p className="text-foreground">{todaysTask.task}</p>
        </div>
      ) : (
        <div className="flex items-center space-x-3 text-muted-foreground">
           <CheckCircle className="w-5 h-5 text-green-500" />
          <p>No task for today. You're either ahead of schedule or the plan is complete. Well done.</p>
        </div>
      )}
    </Card>
  );
};