// src/components/TaskManager.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

// This is the correct definition for a high-level Mission/Task
export interface Task {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'extreme';
    targetDate: Date;
    startDate: Date;
}

interface TaskManagerProps {
    tasks: Task[];
    onTasksChange: (tasks: Task[]) => void;
    selectedTaskId: string | null;
    onSelectTask: (id: string) => void;
    onArchive: (task: Task) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
    tasks,
    onTasksChange,
    selectedTaskId,
    onSelectTask,
    onArchive
}) => {
    // This component no longer deals with roadmaps, only the main mission list.
    // The logic has been simplified to reflect its original purpose.

    const getPriorityClass = (priority: string) => {
        switch (priority) {
            case 'extreme': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            default: return 'bg-green-500/20 text-green-400 border-green-500/50';
        }
    };
    
    return (
        <div>
            <CardHeader>
                <CardTitle>Mission Hub</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Active Missions</h3>
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => onSelectTask(task.id)}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer transition-all",
                                    getPriorityClass(task.priority),
                                    selectedTaskId === task.id ? 'ring-2 ring-accent' : 'hover:bg-primary/10'
                                )}
                            >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold">{task.title}</span>
                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onArchive(task); }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                            </div>
                        ))}
                         {tasks.length === 0 && (
                            <p className="text-muted-foreground text-sm">No active missions. Create one using the AI Planner.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </div>
    );
};

export default TaskManager;