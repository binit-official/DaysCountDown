import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Play, Pause, Trash2, Edit, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface StudyLog {
  id: string
  duration: number
  timestamp: Date
}

interface StudyTimerProps {
  taskText: string
  elapsedSeconds: number
  totalLoggedTime: number
  isActive: boolean
  setIsActive: (isActive: boolean) => void
  studyLogs: StudyLog[]
  onSaveSession: () => boolean
  onEditLog: (logId: string, newDuration: number) => void
  onDeleteLog: (logId: string) => void
  onClose: () => void
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const StudyTimer: React.FC<StudyTimerProps> = ({
  taskText,
  elapsedSeconds,
  totalLoggedTime,
  isActive,
  setIsActive,
  studyLogs,
  onSaveSession,
  onEditLog,
  onDeleteLog,
  onClose,
}) => {
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [newDuration, setNewDuration] = useState(0)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [localLogs, setLocalLogs] = useState<StudyLog[]>(studyLogs);

  // Sync local logs with props when studyLogs change
  React.useEffect(() => {
    setLocalLogs(studyLogs);
  }, [studyLogs]);

  const handleEditClick = (log: StudyLog) => {
    setEditingLogId(log.id);
    setNewDuration(log.duration);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingLogId) {
      setLocalLogs(logs =>
        logs.map(log =>
          log.id === editingLogId ? { ...log, duration: newDuration } : log
        )
      );
      onEditLog(editingLogId, newDuration);
      setEditingLogId(null);
      setEditDialogOpen(false);
    }
  };

  const handleDeleteClick = (logId: string) => {
    setLocalLogs(logs => logs.filter(log => log.id !== logId));
    onDeleteLog(logId);
  };

  // FIX: Show correct logs and update UI instantly

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <Card className="z-50 w-[90vw] max-w-lg neon-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Study Session</CardTitle>
              <CardDescription>{taskText}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current Session</p>
            <p className="text-6xl font-bold tracking-tighter">
              {formatTime(elapsedSeconds)}
            </p>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <Button
              onClick={() => setIsActive(!isActive)}
              size="lg"
              className="w-32"
            >
              {isActive ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button
              onClick={onSaveSession}
              variant="secondary"
              size="lg"
              className="w-32"
              disabled={elapsedSeconds === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
          <div className="mt-8">
            <h4 className="font-semibold mb-2">
              Logged Sessions ({formatTime(totalLoggedTime)})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {localLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sessions logged for this task yet.
                </p>
              ) : (
                localLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <p className="text-sm">
                      {/* FIX: Robust date handling for Firestore Timestamp, string, or Date */}
                      {
                        log.timestamp instanceof Date
                          ? log.timestamp.toLocaleString()
                          : typeof log.timestamp === "string"
                            ? new Date(log.timestamp).toLocaleString()
                            : (log.timestamp && typeof log.timestamp === "object" && "toDate" in log.timestamp && typeof (log.timestamp as any).toDate === "function")
                              ? (log.timestamp as any).toDate().toLocaleString()
                              : "No Date"
                      }
                    </p>
                    <p className="text-sm font-semibold">
                      {formatTime(log.duration)}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditClick(log)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteClick(log.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Separate dialog for editing log duration */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Log Duration</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="duration">
              New Duration (seconds)
            </Label>
            <Input
              id="duration"
              type="number"
              value={newDuration}
              onChange={(e) =>
                setNewDuration(Number(e.target.value))
              }
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}