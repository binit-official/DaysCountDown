<<<<<<< HEAD
// src/pages/Index.tsx

=======
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MotivationalQuote } from '@/components/MotivationalQuote';
import { TaskManager, Task } from '@/components/TaskManager';
import AIPlanner from '@/components/AIPlanner';
import { AIAssistant } from '@/components/AIAssistant';
import { DailyTaskCard } from '@/components/DailyTaskCard';
<<<<<<< HEAD
import { Roadmap } from '@/components/Roadmap';
import { Logo } from '@/components/Logo';
import { UserNav } from '@/components/UserNav';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AlertTriangle, Zap } from 'lucide-react';
=======
import { Logo } from '@/components/Logo';
import { UserNav } from '@/components/UserNav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Zap, Target, Clock, Flame } from 'lucide-react';

const difficultyColors = {
  Easy: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Challenge: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse',
};
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb

const Index = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any | null>(null);
<<<<<<< HEAD
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [hasIncompleteTasks, setHasIncompleteTasks] = useState(false);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);

  useEffect(() => {
    const calculateCurrentDay = () => {
      if (roadmap?.startDate) {
        const startDate = roadmap.startDate.toDate ? roadmap.startDate.toDate() : new Date(roadmap.startDate);
        const now = new Date();
        // Set both dates to the start of the day for an accurate day difference calculation
        startDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const day = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return day > 0 ? day : 1;
      }
      return 1;
    };

    if (roadmap?.dailyTasks) {
      const day = calculateCurrentDay();
      setCurrentDay(day);
      setSelectedDay(day);

      const incomplete = roadmap.dailyTasks.some((task: any) => task.day < day && !task.completed);
      setHasIncompleteTasks(incomplete);

      const allComplete = roadmap.dailyTasks.every((task: any) => task.completed);
      setAllTasksCompleted(allComplete);
    }

    const interval = setInterval(() => {
      const updatedCurrentDay = calculateCurrentDay();
      if (updatedCurrentDay !== currentDay) {
        setCurrentDay(updatedCurrentDay);
        setSelectedDay(updatedCurrentDay);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [roadmap, currentDay]);
=======
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb

  useEffect(() => {
    if (!user) return;

    const tasksDocRef = doc(db, 'users', user.uid, 'data', 'tasks');
    const unsubscribeTasks = onSnapshot(tasksDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().tasks) {
        const loadedTasks = docSnap.data().tasks.map((task: any) => ({
          ...task,
          targetDate: task.targetDate.toDate ? task.targetDate.toDate() : new Date(task.targetDate),
          startDate: task.startDate.toDate ? task.startDate.toDate() : new Date(task.startDate),
        }));
        setTasks(loadedTasks);
        if (!selectedTaskId && loadedTasks.length > 0) {
          setSelectedTaskId(loadedTasks[0].id);
        }
      }
      setLoading(false);
    });

    const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
    const unsubscribeRoadmap = onSnapshot(roadmapDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoadmap(docSnap.data());
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeRoadmap();
    };
  }, [user, selectedTaskId]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  const handleTasksChange = async (updatedTasks: Task[]) => {
    if (!user) return;
    setTasks(updatedTasks);
    const docRef = doc(db, 'users', user.uid, 'data', 'tasks');
    await setDoc(docRef, { tasks: updatedTasks }, { merge: true });
  };
<<<<<<< HEAD

=======
  
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
  const handleRoadmapUpdate = (newRoadmap: any) => {
    if (!user) return;
    setRoadmap(newRoadmap);
    const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
    setDoc(roadmapDocRef, newRoadmap, { merge: true });
  };
<<<<<<< HEAD

  const handleDailyTaskUpdate = (updatedDailyTasks: any[]) => {
    if (!user || !roadmap) return;
    const updatedRoadmap = { ...roadmap, dailyTasks: updatedDailyTasks };
    handleRoadmapUpdate(updatedRoadmap);
  };

=======
  
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
  const handleAssistantUpdate = (updatedTasks: any[]) => {
     if (!user || !roadmap) return;
     const updatedRoadmap = { ...roadmap, dailyTasks: updatedTasks };
     setRoadmap(updatedRoadmap);
     const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
     setDoc(roadmapDocRef, updatedRoadmap, { merge: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-primary">
        <Zap className="w-8 h-8 mr-4 animate-spin" />
        Loading Mission Control...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden border-b border-primary/30">
        <div className="absolute inset-0 bg-gradient-neon opacity-20"></div>
        <div className="relative container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black gradient-text">
                DAYS COUNT DOWN
              </h1>
            </div>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
<<<<<<< HEAD
=======
          
          {/* Left Column: Mission Control */}
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
              <TaskManager tasks={tasks} onTasksChange={handleTasksChange} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
            </Card>
<<<<<<< HEAD
            <AIPlanner onRoadmapChange={handleRoadmapUpdate} />
            <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm border-accent/50">
=======
            <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
              <AIPlanner onRoadmapChange={handleRoadmapUpdate} />
            </Card>
             <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm border-accent/50">
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
              <h3 className="text-lg font-black neon-text mb-4">HARSH TRUTH</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground font-semibold">Active Missions</span><span className="font-black text-primary text-lg">{tasks.length}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground font-semibold">Days Left</span><span className="font-black text-accent text-lg">{selectedTask ? Math.max(0, Math.floor((selectedTask.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground font-semibold">Extreme Tasks</span><span className="font-black text-red-500 text-lg animate-pulse">{tasks.filter(task => task.priority === 'extreme').length}</span></div>
              </div>
            </Card>
          </div>
<<<<<<< HEAD
=======

          {/* Center Column: Main Focus */}
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
          <div className="lg:col-span-6 space-y-6">
            <Card className="p-4 md:p-8 neon-border bg-card/90 backdrop-blur-sm">
              {selectedTask ? (
                <CountdownTimer key={selectedTask.id} targetDate={selectedTask.targetDate} startDate={selectedTask.startDate} title={selectedTask.title} />
              ) : (
                <div className="text-center py-20">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500 animate-pulse" />
                  <h3 className="text-3xl font-black mb-2 text-red-500">NO MISSION SELECTED</h3>
                </div>
              )}
            </Card>
            <MotivationalQuote />
          </div>
<<<<<<< HEAD
          <div className="lg:col-span-3 space-y-6">
            <DailyTaskCard roadmap={roadmap} selectedDay={selectedDay} onRoadmapUpdate={handleDailyTaskUpdate} currentDay={currentDay} />
            <AIAssistant
              currentRoadmap={roadmap}
              onRoadmapUpdate={handleAssistantUpdate}
              hasIncompleteTasks={hasIncompleteTasks}
              allTasksCompleted={allTasksCompleted}
            />
            <Roadmap roadmap={roadmap} selectedDay={selectedDay} onSelectDay={setSelectedDay} currentDay={currentDay} />
=======

          {/* Right Column: Daily Actions & Intel */}
          <div className="lg:col-span-3 space-y-6">
            <DailyTaskCard roadmap={roadmap} />
            <AIAssistant currentRoadmap={roadmap} onRoadmapUpdate={handleAssistantUpdate} />
            <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4">Full Roadmap</h3>
              <ScrollArea className="h-64">
                {roadmap?.dailyTasks?.length > 0 ? (
                  <ul className="space-y-3 pr-4">
                    {roadmap.dailyTasks.map((task: any) => (
                      <li key={task.day} className="text-sm border-b border-muted/20 pb-3 relative">
                        <Badge variant="outline" className={`absolute top-0 right-0 text-xs ${difficultyColors[task.difficulty as keyof typeof difficultyColors] || difficultyColors.Medium}`}>
                          {task.difficulty}
                        </Badge>
                        <strong className="text-primary">Day {task.day}:</strong>
                        <p className="mt-1 text-muted-foreground">{task.task}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm p-4 text-center">Generate a roadmap to see your full plan.</p>
                )}
              </ScrollArea>
            </Card>
>>>>>>> 776f5e8f3069168216dee8446b79c4ecb0ccfdcb
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;