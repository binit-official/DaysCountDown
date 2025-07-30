// src/components/TaskManager.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { Trash2, Edit, PlusCircle } from 'lucide-react';


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

// This is a reusable form for both creating and editing missions.
const MissionForm: React.FC<{mission?: Task, onSave: (mission: Omit<Task, 'id'> | Task) => void}> = ({mission, onSave}) => {
    const [title, setTitle] = useState(mission?.title || '');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'extreme'>(mission?.priority || 'medium');
    const [targetDate, setTargetDate] = useState<Date | undefined>(mission?.targetDate || new Date());

    const handleSave = () => {
        if (title && targetDate) {
            const missionData = {
                ...mission,
                title,
                priority,
                targetDate,
                startDate: mission?.startDate || new Date()
            };
            onSave(missionData as Task);
        }
    };
    
    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">Priority</Label>
                 <Select 
                    onValueChange={(value: string) => setPriority(value as 'low' | 'medium' | 'high' | 'extreme')} 
                    defaultValue={priority}
                 >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Target Date</Label>
                 <div className="col-span-3">
                    <DatePicker date={targetDate} setDate={setTargetDate} />
                 </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button onClick={handleSave} disabled={!title || !targetDate}>Save Mission</Button>
                </DialogClose>
            </DialogFooter>
        </div>
    );
}


const TaskManager: React.FC<TaskManagerProps> = ({
    tasks,
    onTasksChange,
    selectedTaskId,
    onSelectTask,
    onArchive
}) => {
    
     const handleSaveMission = (missionData: Omit<Task, 'id'> | Task) => {
        let updatedTasks;
        if ('id' in missionData && missionData.id) {
            // Editing existing mission
            updatedTasks = tasks.map(t => t.id === missionData.id ? missionData as Task : t);
        } else {
            // Adding new mission
            const newMission: Task = { ...missionData, id: Date.now().toString() } as Task;
            updatedTasks = [...tasks, newMission];
        }
        onTasksChange(updatedTasks);
    };

    const handleDeleteMission = (id: string) => {
        const updatedTasks = tasks.filter(t => t.id !== id);
        onTasksChange(updatedTasks);
    };


    return (
        <div>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mission Hub</CardTitle>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm"><PlusCircle className="h-5 w-5"/></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Mission</DialogTitle>
                        </DialogHeader>
                        <MissionForm onSave={handleSaveMission} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => onSelectTask(task.id)}
                            className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center",
                                selectedTaskId === task.id ? 'ring-2 ring-accent' : 'hover:bg-primary/10'
                            )}
                        >
                            <span className="font-bold">{task.title}</span>
                            <div className="flex items-center gap-1">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e=>e.stopPropagation()}><Edit className="h-4 w-4"/></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Mission</DialogTitle>
                                        </DialogHeader>
                                        <MissionForm mission={task} onSave={handleSaveMission} />
                                    </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDeleteMission(task.id); }}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">No active missions. Click the '+' to create one.</p>
                    )}
                </div>
            </CardContent>
        </div>
    );
};

export default TaskManager;