// src/components/Roadmap.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DatePicker } from './ui/date-picker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from 'date-fns';

interface RoadmapProps {
    roadmap: any;
    selectedDay: number;
    onSelectDay: (day: number) => void;
    currentDay: number;
    onShift: (newStartDate: Date) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ roadmap, selectedDay, onSelectDay, currentDay, onShift }) => {
    const [newStartDate, setNewStartDate] = React.useState<Date | undefined>();
    const [isShifting, setIsShifting] = React.useState(false);
    
    const handleConfirmShift = () => {
        if (newStartDate) {
            onShift(newStartDate);
            setIsShifting(false);
        }
    };

    const getDateForDay = (day: number): Date | null => {
        if (!roadmap?.startDate) return null;
        const date = new Date(roadmap.startDate);
        date.setDate(date.getDate() + day - 1);
        return date;
    }

    return (
        <Card className="neon-border bg-card/90 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Roadmap Overview</CardTitle>
                {roadmap && (
                    isShifting ? (
                        <div className="flex items-center gap-2">
                            <DatePicker date={newStartDate} setDate={setNewStartDate} />
                            <Button onClick={handleConfirmShift} size="sm" disabled={!newStartDate}>Confirm</Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsShifting(false)}>Cancel</Button>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsShifting(true)}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Shift Dates
                        </Button>
                    )
                )}
            </CardHeader>
            <CardContent>
                {roadmap?.dailyTasks ? (
                    <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-15 gap-2">
                        {roadmap.dailyTasks.map((task: any) => {
                            const taskDate = getDateForDay(task.day);
                            // FIX: Detect break day for coloring
                            const isBreakDay = !!task.isBreak || (task.task === "Break Day");
                            return (
                                <Popover key={task.day}>
                                    <PopoverTrigger asChild>
                                        <button
                                            onClick={() => onSelectDay(task.day)}
                                            className={cn(
                                                "p-2 text-xs rounded-md flex flex-col items-center justify-center font-bold aspect-square transition-all",
                                                task.day === selectedDay ? "bg-primary text-primary-foreground ring-2 ring-accent" : "bg-muted hover:bg-muted/80",
                                                isBreakDay
                                                    ? "bg-yellow-400/60 text-yellow-900" // Highlight break days
                                                    : task.day < currentDay && !task.completed
                                                        ? "bg-red-500/30 text-red-100"
                                                        : task.day < currentDay && task.completed
                                                            ? "bg-green-500/30 text-green-100"
                                                            : "",
                                                task.day === currentDay && "animate-pulse"
                                            )}
                                        >
                                            <span className="text-lg">{task.day}</span>
                                            {taskDate && <span className="text-muted-foreground text-[10px]">{format(taskDate, 'MMM d')}</span>}
                                            {isBreakDay && (
                                                <span className="text-[10px] font-bold text-yellow-900 mt-1">Break</span>
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <div className="space-y-2">
                                            <p className="font-bold">Day {task.day} - {taskDate && format(taskDate, 'PPP')}</p>
                                            <p className="text-sm font-semibold text-primary">{task.difficulty}</p>
                                            <ul className="list-disc list-inside text-sm">
                                                {task.task.split(';').map((t:string, i:number) => <li key={i}>{t.trim()}</li>)}
                                            </ul>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Generate a roadmap to see your timeline.</p>
                )}
            </CardContent>
        </Card>
    );
};