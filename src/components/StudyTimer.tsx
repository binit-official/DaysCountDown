import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Pause, Save, X, Trash2, Edit } from 'lucide-react';
import { Input } from './ui/input';
import { format } from 'date-fns';

export interface StudyLog {
  id: string;
  duration: number; // in seconds
  timestamp: Date;
}

interface StudyTimerProps {
  taskText: string;
  elapsedSeconds: number;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  studyLogs: StudyLog[];
  onAddLog: (duration: number) => void;
  onEditLog: (logId: string, newDuration: number) => void;
  onDeleteLog: (logId: string) => void;
  onClose: () => void;
}

export const StudyTimer = ({ taskText, elapsedSeconds, isActive, setIsActive, studyLogs, onAddLog, onEditLog, onDeleteLog, onClose }: StudyTimerProps) => {
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => setSessionSeconds(seconds => seconds + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (isDragging && dragStartRef.current) {
      e.preventDefault();
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPosition({
        x: dragStartRef.current.initialX + dx,
        y: dragStartRef.current.initialY + dy,
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSaveAndClose = () => {
    if (sessionSeconds > 0) {
      onAddLog(sessionSeconds);
    }
    onClose();
  };
  
  const handleEditClick = (log: StudyLog) => {
    setEditingLogId(log.id);
    setEditMinutes(Math.floor(log.duration / 60).toString());
  };
  
  const handleSaveEdit = (logId: string) => {
    const newDurationInSeconds = parseInt(editMinutes, 10) * 60;
    if (!isNaN(newDurationInSeconds) && newDurationInSeconds >= 0) {
      onEditLog(logId, newDurationInSeconds);
    }
    setEditingLogId(null);
    setEditMinutes('');
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{ 
        position: 'fixed',
        top: `${position.y}px`, 
        left: `${position.x}px`, 
        transform: `translate(-50%, -50%)` 
      }}
      className="z-50 w-[90vw] max-w-md"
    >
      <Card className="neon-border bg-card/95 backdrop-blur-sm shadow-2xl shadow-black/50">
        <CardHeader 
            onMouseDown={handleMouseDown} 
            style={{ userSelect: 'none', cursor: 'move' }}
            className="flex flex-row items-center justify-between"
        >
            <div>
                <CardTitle>Study Session</CardTitle>
                <CardDescription className="truncate pt-1">Task: {taskText}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer h-8 w-8"><X /></Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="text-4xl md:text-5xl font-mono font-black text-muted-foreground">
                Total: {formatTime(elapsedSeconds)}
            </div>
            <div className="text-6xl font-mono font-black text-primary neon-text">
                +{formatTime(sessionSeconds)}
            </div>
            <div className="flex w-full gap-4">
                <Button onClick={() => setIsActive(!isActive)} className="w-full cyberpunk-button">
                    {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={handleSaveAndClose} variant="outline" className="w-full">
                    <Save className="mr-2" />
                    Save & Close
                </Button>
            </div>

            {studyLogs && studyLogs.length > 0 && (
            <div className="w-full space-y-2 pt-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Logged Sessions</h4>
                <div className="max-h-32 overflow-y-auto pr-2">
                {studyLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    {editingLogId === log.id ? (
                        <div className="flex items-center gap-2">
                        <Input type="number" value={editMinutes} onChange={e => setEditMinutes(e.target.value)} className="h-8 w-20" />
                        <span>minutes</span>
                        <Button size="sm" onClick={() => handleSaveEdit(log.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingLogId(null)}>Cancel</Button>
                        </div>
                    ) : (
                        <>
                        <div className="flex flex-col">
                            {/* FIX: Precise time formatting for logs */}
                            <span className="font-semibold">{formatTime(log.duration)}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                        </div>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(log)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={() => onDeleteLog(log.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        </>
                    )}
                    </div>
                ))}
                </div>
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};