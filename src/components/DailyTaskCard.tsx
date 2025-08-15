import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, Move } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';


export interface StudyLog {
    id: string;
    duration: number;
    timestamp: Date;
}
export interface SubTask {
    text: string;
    completed: boolean;
    studyLogs?: StudyLog[];
}
export interface DailyTask {
    day: number;
    task: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Challenge';
    completed: boolean;
    subTasks?: SubTask[];
    date?: string;
}
export interface Roadmap {
    id: string;
    goal: string;
    startDate?: Date;
    days: number;
    dailyTasks: DailyTask[];
}


interface DailyTaskCardProps {
    roadmap: Roadmap | null;
    selectedDay: number;
    currentDay: number;
    onRoadmapUpdate: (updatedDailyTasks: DailyTask[], completedTask?: DailyTask) => void;
    onOpenTimer: (day: number, subTaskIndex: number, taskText: string, logs: StudyLog[]) => void;
    onSetStartDate: (date: Date) => void;
    onRelocateTask: (sourceDay: number, taskIndex: number, destinationDay: number) => void;
    onMarkBreakDay?: (day: number) => void;
    onRemoveBreakDay?: (day: number) => void;
    onDeleteDay?: (day: number) => void;
    breakDays?: number[];
}

export const DailyTaskCard: React.FC<DailyTaskCardProps> = ({
    roadmap,
    selectedDay,
    currentDay,
    onRoadmapUpdate,
    onOpenTimer,
    onSetStartDate,
    onRelocateTask,
    onMarkBreakDay,
    onRemoveBreakDay,
    onDeleteDay,
    breakDays = [],
}) => {
    const [newStartDate, setNewStartDate] = React.useState<Date | undefined>();
    const [relocatingTask, setRelocatingTask] = React.useState<{taskIndex: number, destDay: number} | null>(null);

    const taskForSelectedDay = roadmap?.dailyTasks.find(t => t.day === selectedDay);
    const isRoadmapFuture = roadmap?.startDate && new Date(roadmap.startDate) > new Date();
    const isBreakDay = breakDays.includes(selectedDay);

    const handleToggleSubTask = (subTaskIndex: number) => {
        if (!roadmap || !taskForSelectedDay) return;

        const updatedDailyTasks = roadmap.dailyTasks.map(dayTask => {
            if (dayTask.day === selectedDay) {
                const subTasks = (dayTask.subTasks && dayTask.subTasks.length > 0)
                    ? dayTask.subTasks
                    : dayTask.task.split(';').map(t => ({ text: t.trim(), completed: false, studyLogs: [] }));

                const updatedSubTasks = subTasks.map((sub, i) =>
                    i === subTaskIndex ? { ...sub, completed: !sub.completed } : sub
                );

                const areAllSubTasksComplete = updatedSubTasks.every(sub => sub.completed);
                return { ...dayTask, subTasks: updatedSubTasks, completed: areAllSubTasksComplete };
            }
            return dayTask;
        });
        
        const completedTask = updatedDailyTasks.find(t => t.day === selectedDay);
        onRoadmapUpdate(updatedDailyTasks, completedTask?.completed ? completedTask : undefined);
    };

    const subTasks = React.useMemo(() => {
        if (!taskForSelectedDay) return [];
        if (taskForSelectedDay.subTasks && taskForSelectedDay.subTasks.length > 0) {
            return taskForSelectedDay.subTasks;
        }
        return taskForSelectedDay.task.split(';').map(t => ({ text: t.trim(), completed: false, studyLogs: [] }));
    }, [taskForSelectedDay]);

    const handleConfirmRelocation = () => {
        if(relocatingTask && relocatingTask.destDay) {
            onRelocateTask(selectedDay, relocatingTask.taskIndex, relocatingTask.destDay);
            setRelocatingTask(null);
        }
    };
    
    const renderContent = () => {
        if (!roadmap) {
            return <p className="text-muted-foreground">No active roadmap.</p>;
        }
        if (!roadmap.startDate) {
            return (
                <div className="flex flex-col items-start gap-4">
                    <p className="text-muted-foreground">Set a start date for your roadmap to begin.</p>
                    <DatePicker date={newStartDate} setDate={setNewStartDate} />
                    <Button onClick={() => newStartDate && onSetStartDate(newStartDate)} disabled={!newStartDate}>
                        Start Roadmap
                    </Button>
                </div>
            );
        }
        if (isRoadmapFuture && selectedDay === currentDay) {
            return (
                <div className="text-center py-8">
                    <p className="font-semibold">Your roadmap is scheduled to begin on:</p>
                    <p className="text-lg text-primary">{format(new Date(roadmap.startDate), 'PPP')}</p>
                </div>
            );
        }
        if (!taskForSelectedDay) {
            return <p className="text-muted-foreground">No tasks for this day.</p>;
        }

        return (
             <div className="space-y-4">
                <ul className="space-y-3">
                    {subTasks.map((sub, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <Checkbox
                                id={`subtask-${index}`}
                                checked={sub.completed}
                                onCheckedChange={() => handleToggleSubTask(index)}
                                disabled={selectedDay > currentDay && !sub.completed}
                            />
                            <label
                                htmlFor={`subtask-${index}`}
                                className={`flex-grow ${sub.completed ? 'line-through text-muted-foreground' : ''}`}
                            >
                                {sub.text}
                            </label>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenTimer(selectedDay, index, sub.text, sub.studyLogs || [])}>
                                <Clock className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRelocatingTask({taskIndex: index, destDay: selectedDay})}>
                                <Move className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <>
            <Card className="neon-border bg-card/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>
                        {`Day ${selectedDay}`}
                        {selectedDay === currentDay && !isRoadmapFuture && <Badge className="ml-2">Today</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">
                      Day {selectedDay} Tasks
                    </h3>
                    {/* Mark/Remove Break Day button */}
                    {typeof onMarkBreakDay === "function" && !isBreakDay && (
                      <button
                        className="px-3 py-1 rounded bg-yellow-400 text-yellow-900 font-semibold shadow hover:bg-yellow-500 transition"
                        onClick={() => onMarkBreakDay(selectedDay)}
                      >
                        Mark as Break Day
                      </button>
                    )}
                    {typeof onRemoveBreakDay === "function" && isBreakDay && (
                      <button
                        className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 font-semibold shadow hover:bg-yellow-200 transition"
                        onClick={() => onRemoveBreakDay(selectedDay)}
                      >
                        Remove Break Day
                      </button>
                    )}
                    {/* Add Delete Day button */}
                    {typeof onDeleteDay === "function" && (
                      <button
                        className="px-3 py-1 rounded bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition ml-2"
                        onClick={() => onDeleteDay(selectedDay)}
                      >
                        Delete Day
                      </button>
                    )}
                  </div>
                    {renderContent()}
                </CardContent>
            </Card>
            {relocatingTask && roadmap && (
                <Dialog open={!!relocatingTask} onOpenChange={() => setRelocatingTask(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Relocate Task</DialogTitle>
                            <DialogDescription>
                                Choose a new day to move this task to.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Select
                                onValueChange={(value) => setRelocatingTask({...relocatingTask, destDay: parseInt(value)})}
                                defaultValue={String(relocatingTask.destDay)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a day" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roadmap.dailyTasks.map(task => (
                                        <SelectItem key={task.day} value={String(task.day)}>
                                            Day {task.day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRelocatingTask(null)}>Cancel</Button>
                            <Button onClick={handleConfirmRelocation}>Confirm</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};