// src/components/Roadmap.tsx

import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface RoadmapProps {
  roadmap: any | null;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  currentDay: number;
}

const difficultyColors = {
  Easy: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Challenge: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse',
};

export const Roadmap = ({ roadmap, selectedDay, onSelectDay, currentDay }: RoadmapProps) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const currentDayRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (currentDayRef.current && scrollViewportRef.current) {
      // We have both the container and the target element.
      // Now, we can calculate the exact scroll position.
      const viewport = scrollViewportRef.current;
      const element = currentDayRef.current;
      
      // Calculate the position of the current day's task relative to the scrollable container
      const offsetTop = element.offsetTop;
      
      // Scroll the container to bring the element to the top
      viewport.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  }, [currentDay, roadmap]); // Rerun when the roadmap data is available or the day changes.

  if (!roadmap || !roadmap.dailyTasks || roadmap.dailyTasks.length === 0) {
    return (
      <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
        <h3 className="text-lg font-bold mb-4">Full Roadmap</h3>
        <p className="text-muted-foreground text-sm p-4 text-center">Generate a roadmap to see your full plan.</p>
      </Card>
    );
  }

  const startDate = roadmap.startDate ? (roadmap.startDate.toDate ? roadmap.startDate.toDate() : new Date(roadmap.startDate)) : new Date();

  return (
    <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4">Full Roadmap</h3>
      <ScrollArea className="h-64" viewportRef={scrollViewportRef}>
        <ul className="space-y-3 pr-4">
          {roadmap.dailyTasks.map((task: any) => {
            const taskDate = new Date(startDate);
            taskDate.setDate(startDate.getDate() + task.day - 1);

            return (
              <li
                key={task.day}
                ref={task.day === currentDay ? currentDayRef : null}
                className={`text-sm border-b border-muted/20 p-2 rounded-md relative cursor-pointer transition-colors ${selectedDay === task.day ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
                onClick={() => onSelectDay(task.day)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-primary">Day {task.day}</strong>
                    <span className="text-xs text-muted-foreground ml-2">{format(taskDate, 'MMM d')}</span>
                  </div>
                  {task.day < currentDay && (
                    task.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                    )
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">{task.task}</p>
                <Badge variant="outline" className={`absolute bottom-1 right-0 text-xs ${difficultyColors[task.difficulty as keyof typeof difficultyColors] || difficultyColors.Medium}`}>
                  {task.difficulty}
                </Badge>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </Card>
  );
};