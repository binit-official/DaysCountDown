// src/components/Roadmap.tsx

import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle, Radio } from 'lucide-react';
import { format, isValid } from 'date-fns';

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
  Challenge: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export const Roadmap = ({ roadmap, selectedDay, onSelectDay, currentDay }: RoadmapProps) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const currentDayRef = useRef<HTMLLIElement>(null);
  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (roadmap && currentDayRef.current && scrollViewportRef.current && !hasAutoScrolled.current) {
      const viewport = scrollViewportRef.current;
      const element = currentDayRef.current;
      const topPos = element.offsetTop - viewport.offsetTop;

      setTimeout(() => {
        viewport.scrollTo({ top: topPos, behavior: 'smooth' });
        hasAutoScrolled.current = true;
      }, 100);
    }
  }, [roadmap]);

  if (!roadmap || !roadmap.dailyTasks || roadmap.dailyTasks.length === 0) {
    return (
      <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm animate-fade-in-up">
        <h3 className="text-lg font-bold mb-4">Full Roadmap</h3>
        <p className="text-muted-foreground text-sm p-4 text-center">Generate a roadmap to see your full plan.</p>
      </Card>
    );
  }
  
  const startDate = roadmap.startDate instanceof Date ? roadmap.startDate : new Date();
  if (!isValid(startDate)) {
      console.error("Roadmap received an invalid startDate.");
      return <div>Error: Invalid roadmap start date.</div>
  }


  return (
    <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm animate-fade-in-up">
      <h3 className="text-2xl font-bold mb-6 text-center gradient-text">Your Mission Blueprint</h3>
      <ScrollArea className="h-[400px] lg:h-[500px]" viewportRef={scrollViewportRef} scrollbarClassName="invisible">
        <div className="relative pl-6">
          <div className="absolute left-0 top-0 h-full w-0.5 bg-border/50" />
          <ul className="space-y-8">
            {roadmap.dailyTasks.map((task: any, index: number) => {
              const taskDate = new Date(startDate);
              if (isValid(taskDate)) {
                  taskDate.setDate(startDate.getDate() + (task.day - 1));
              }
              const isSelected = selectedDay === task.day;
              
              const formattedDate = isValid(taskDate) ? format(taskDate, 'MMMM d') : 'Date Error';

              return (
                <li
                  key={`${task.day}-${index}`} 
                  ref={task.day === currentDay ? currentDayRef : null}
                  className="relative pl-6 cursor-pointer group"
                  onClick={() => onSelectDay(task.day)}
                >
                  <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full border-4 transition-colors ${isSelected ? 'border-primary bg-primary/50' : 'border-card bg-border group-hover:bg-primary/50'}`} />
                  <div className="transition-transform duration-300 group-hover:translate-x-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 flex-shrink-0">
                        {task.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-baseline space-x-3 flex-grow">
                        <strong className="text-primary text-lg">Day {task.day}</strong>
                        <span className="text-sm font-semibold text-muted-foreground">{formattedDate}</span>
                        <div className="flex-grow" />
                        {task.day < currentDay && !task.completed && (
                            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                        )}
                        {task.day === currentDay && !task.completed && (
                            <Radio className="w-5 h-5 text-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-base text-foreground/80 pl-7">{task.task}</p>
                    <div className="mt-2 text-left pl-7">
                        <Badge variant="outline" className={`text-xs ${difficultyColors[task.difficulty as keyof typeof difficultyColors] || difficultyColors.Medium}`}>
                          {task.difficulty}
                        </Badge>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </ScrollArea>
    </Card>
  );
};