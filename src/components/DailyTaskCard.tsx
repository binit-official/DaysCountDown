import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, CheckCircle } from 'lucide-react';

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
  // Add 1 to make it 1-indexed for the user
  const currentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const todaysTask = roadmap.dailyTasks.find((task: any) => task.day === currentDay);

  // Split the task string into individual sub-tasks using semicolon as the primary delimiter
  const subTasks = todaysTask ? todaysTask.task.split(';').map(s => s.trim()).filter(Boolean) : [];

  return (
    <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-primary/50">
      <h3 className="text-lg font-bold mb-4 text-primary neon-text">Today's Mission (Day {currentDay})</h3>
      {todaysTask && subTasks.length > 0 ? (
        <div className="space-y-3">
          {subTasks.map((subTask: string, index: number) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox id={`task-${currentDay}-${index}`} className="neon-border" />
              <label
                htmlFor={`task-${currentDay}-${index}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {subTask}
              </label>
            </div>
          ))}
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