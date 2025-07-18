// src/pages/Index.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MotivationalQuote } from '@/components/MotivationalQuote';
import { TaskManager, Task } from '@/components/TaskManager';
import AIPlanner from '@/components/AIPlanner';
import { AIAssistant } from '@/components/AIAssistant';
import { DailyTaskCard } from '@/components/DailyTaskCard';
import { Roadmap } from '@/components/Roadmap';
import { Logo } from '@/components/Logo';
import { UserNav } from '@/components/UserNav';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AlertTriangle, Zap, Flame, Target } from 'lucide-react';
import { Footer } from '@/components/Footer';

const Index = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [hasIncompleteTasks, setHasIncompleteTasks] = useState(false);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);

  useEffect(() => {
    const calculateCurrentDay = () => {
      if (roadmap?.startDate) {
        const startDate = roadmap.startDate.toDate ? roadmap.startDate.toDate() : new Date(roadmap.startDate);
        const now = new Date();
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

  const handleRoadmapUpdate = (newRoadmap: any) => {
    if (!user) return;
    setRoadmap(newRoadmap);
    const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
    setDoc(roadmapDocRef, newRoadmap, { merge: true });
  };

  const handleDailyTaskUpdate = (updatedDailyTasks: any[]) => {
    if (!user || !roadmap) return;
    const updatedRoadmap = { ...roadmap, dailyTasks: updatedDailyTasks };
    handleRoadmapUpdate(updatedRoadmap);
  };

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative overflow-hidden border-b border-primary/30">
        <div className="absolute inset-0 bg-gradient-neon opacity-20"></div>
        <div className="relative container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black gradient-text flex items-center gap-4">
                <Flame className="w-8 h-8 md:w-12 md:h-12 text-accent animate-pulse" />
                DAYS COUNT DOWN
                <Target className="w-8 h-8 md:w-12 md:h-12 text-accent animate-pulse" />
              </h1>
            </div>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm">
              <TaskManager tasks={tasks} onTasksChange={handleTasksChange} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
            </Card>
            <AIPlanner onRoadmapChange={handleRoadmapUpdate} />
            <Card className="p-4 neon-border bg-card/90 backdrop-blur-sm border-accent/50">
              <h3 className="text-lg font-black neon-text mb-4">HARSH TRUTH</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground font-semibold">Active Missions</span><span className="font-black text-primary text-lg">{tasks.length}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground font-semibold">Days Left</span><span className="font-black text-accent text-lg">{selectedTask ? Math.max(0, Math.floor((selectedTask.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground font-semibold">Extreme Tasks</span><span className="font-black text-red-500 text-lg animate-pulse">{tasks.filter(task => task.priority === 'extreme').length}</span></div>
              </div>
            </Card>
          </div>
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
          <div className="lg:col-span-3 space-y-6">
            <DailyTaskCard roadmap={roadmap} selectedDay={selectedDay} onRoadmapUpdate={handleDailyTaskUpdate} currentDay={currentDay} />
            <AIAssistant
              currentRoadmap={roadmap}
              onRoadmapUpdate={handleAssistantUpdate}
              hasIncompleteTasks={hasIncompleteTasks}
              allTasksCompleted={allTasksCompleted}
            />
          </div>
        </div>
        <div className="mt-8 lg:mt-12">
          <Roadmap roadmap={roadmap} selectedDay={selectedDay} onSelectDay={setSelectedDay} currentDay={currentDay} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;