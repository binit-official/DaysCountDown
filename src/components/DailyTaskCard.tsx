<<<<<<< HEAD
// src/components/DailyTaskCard.tsx

import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DailyTaskCardProps {
  roadmap: any | null;
  selectedDay: number;
  onRoadmapUpdate: (updatedTasks: any[]) => void;
  currentDay: number;
}

export const DailyTaskCard = ({ roadmap, selectedDay, onRoadmapUpdate, currentDay }: DailyTaskCardProps) => {
  if (!roadmap || !roadmap.dailyTasks || roadmap.dailyTasks.length === 0) {
    return null;
  }

  const startDate = roadmap.startDate ? (roadmap.startDate.toDate ? roadmap.startDate.toDate() : new Date(roadmap.startDate)) : new Date();

  const handleSubTaskCompletion = (day: number, subTaskIndex: number, completed: boolean) => {
    const updatedTasks = roadmap.dailyTasks.map((task: any) => {
      if (task.day === day) {
        const subTasks = task.task.split(';').map((s: string) => s.trim());
        const newSubTasks = subTasks.map((text: string, i: number) => ({
          text,
          completed: i === subTaskIndex ? completed : (task.subTasks && task.subTasks[i] ? task.subTasks[i].completed : false),
        }));
        const allCompleted = newSubTasks.every((st: any) => st.completed);
        return { ...task, subTasks: newSubTasks, completed: allCompleted };
      }
      return task;
    });
    onRoadmapUpdate(updatedTasks);
  };

  const selectedDayTask = roadmap.dailyTasks.find((task: any) => task.day === selectedDay);
  const subTasks = selectedDayTask ? selectedDayTask.task.split(';').map((s:string) => s.trim()).filter(Boolean) : [];

  const previousIncompleteTasks = roadmap.dailyTasks.filter(
    (task: any) => task.day < currentDay && !task.completed
  );

  const selectedDate = new Date(startDate);
  selectedDate.setDate(startDate.getDate() + selectedDay - 1);

  return (
    <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-primary/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-primary neon-text">Mission for Day {selectedDay}</h3>
        <span className="text-sm text-muted-foreground">{format(selectedDate, 'MMMM d, yyyy')}</span>
      </div>

      {previousIncompleteTasks.length > 0 && selectedDay === currentDay && (
        <div className="mb-4 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h4 className="font-bold">INCOMPLETE TASKS!</h4>
          </div>
          <ul className="list-disc list-inside mt-2 text-sm">
            {previousIncompleteTasks.map((task: any) => (
              <li key={task.day}>Day {task.day}: {task.task}</li>
            ))}
          </ul>
        </div>
      )}

      {selectedDayTask && subTasks.length > 0 ? (
        <div className="space-y-3">
          {subTasks.map((subTask: string, index: number) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`task-${selectedDay}-${index}`}
                checked={selectedDayTask.subTasks && selectedDayTask.subTasks[index] ? selectedDayTask.subTasks[index].completed : false}
                onCheckedChange={(checked) => handleSubTaskCompletion(selectedDay, index, !!checked)}
                className="neon-border"
              />
              <label
                htmlFor={`task-${selectedDay}-${index}`}
                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                  selectedDayTask.subTasks && selectedDayTask.subTasks[index] && selectedDayTask.subTasks[index].completed ? 'line-through text-muted-foreground' : ''
                }`}
=======
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
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
              >
                {subTask}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center space-x-3 text-muted-foreground">
           <CheckCircle className="w-5 h-5 text-green-500" />
<<<<<<< HEAD
          <p>No task for today.</p>
=======
          <p>No task for today. You're either ahead of schedule or the plan is complete. Well done.</p>
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
        </div>
      )}
    </Card>
  );
};