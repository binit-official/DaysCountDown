import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';

export const RoadmapPreview = ({ proposedRoadmap, onCancel, onApprove, currentDay }: { proposedRoadmap: any, onCancel: () => void, onApprove: () => void, currentDay: number }) => {
  if (!proposedRoadmap) return null;

  const futureTasks = proposedRoadmap.dailyTasks.filter((task: any) => task.day >= currentDay);

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Your New Roadmap</DialogTitle>
          <DialogDescription>
            Review the proposed changes below. The new tasks will only be saved when you click "Approve & Save".
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4 border rounded-md p-4">
          <div className="space-y-4">
            {futureTasks.map((task: any) => (
              <div key={task.day} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-bold text-primary">
                  Day {task.day} - {format(new Date(proposedRoadmap.startDate.getTime() + (task.day - 1) * 86400000), 'MMM d')}
                </p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {task.task.split(';').map((sub: string, i: number) => (
                    <li key={i} className={sub.includes('[Recovery]') ? 'text-accent-foreground font-semibold' : ''}>
                      {sub.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onApprove}>Approve & Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};