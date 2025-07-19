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
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { AlertTriangle, Zap, Flame, Target } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';

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
    const calculateCurrentDay = (startDate: Date | undefined) => {
      if (startDate && !isNaN(startDate.getTime())) {
        const now = new Date();
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const day = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return day > 0 ? day : 1;
      }
      return 1;
    };

    if (roadmap?.dailyTasks && roadmap.startDate) {
      const day = calculateCurrentDay(roadmap.startDate);
      setCurrentDay(day);
      setSelectedDay(day);

      const incomplete = roadmap.dailyTasks.some((task: any) => task.day < day && !task.completed);
      setHasIncompleteTasks(incomplete);

      const allComplete = roadmap.dailyTasks.every((task: any) => task.completed);
      setAllTasksCompleted(allComplete);
    }
  }, [roadmap]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const tasksDocRef = doc(db, 'users', user.uid, 'data', 'tasks');
    const unsubscribeTasks = onSnapshot(tasksDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().tasks) {
        const loadedTasks = docSnap.data().tasks.map((task: any) => ({
          ...task,
          targetDate: task.targetDate.toDate(),
          startDate: task.startDate.toDate(),
        }));
        setTasks(loadedTasks);
        if (!selectedTaskId && loadedTasks.length > 0) {
          setSelectedTaskId(loadedTasks[0].id);
        }
      } else {
        setTasks([]);
      }
      setLoading(false);
    });

    const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
    const unsubscribeRoadmap = onSnapshot(roadmapDocRef, (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoadmap({ ...data, startDate: data.startDate.toDate() });
      } else {
        setRoadmap(null);
      }
    });

    const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
    const unsubscribeStats = onSnapshot(statsDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const lastCompleted = data.lastCompleted?.toDate();
            if (lastCompleted && !isToday(lastCompleted) && !isYesterday(lastCompleted)) {
                await updateDoc(statsDocRef, { streak: 0 });
            }
        }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeRoadmap();
      unsubscribeStats();
    };
  }, [user, selectedTaskId]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const isNewUser = tasks.length === 0 && !loading;

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

  const checkStreaksAndAchievements = async () => {
    if (!user) return;
    const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
    const docSnap = await getDoc(statsDocRef);
    const stats = docSnap.exists() ? docSnap.data() : { streak: 0, lastCompleted: null, unlockedAchievements: [] };

    const lastCompletedDate = stats.lastCompleted?.toDate();

    if (lastCompletedDate && isToday(lastCompletedDate)) {
      return;
    }

    const newStreak = (lastCompletedDate && isYesterday(lastCompletedDate))
      ? (stats.streak || 0) + 1
      : 1;

    const newAchievements = [...(stats.unlockedAchievements || [])];
    if (newStreak >= 3 && !newAchievements.includes('streak_3')) newAchievements.push('streak_3');
    if (newStreak >= 7 && !newAchievements.includes('streak_7')) newAchievements.push('streak_7');

    const newStats = {
      ...stats,
      streak: newStreak,
      lastCompleted: new Date(),
      unlockedAchievements: newAchievements
    };

    await setDoc(statsDocRef, newStats, { merge: true });
    toast.success(`Streak extended to ${newStreak} days!`);
  };

  const handleDailyTaskUpdate = async (updatedDailyTasks: any[]) => {
    if (!user || !roadmap) return;
    
    const newlyCompletedTask = updatedDailyTasks.find(t => {
      const originalTask = roadmap.dailyTasks.find((ot: any) => ot.day === t.day);
      return t.day === currentDay && t.completed && (!originalTask || !originalTask.completed);
    });

    const updatedRoadmap = { ...roadmap, dailyTasks: updatedDailyTasks };
    setRoadmap(updatedRoadmap);

    if (newlyCompletedTask) {
      await checkStreaksAndAchievements();
    }
    
    const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
    await setDoc(roadmapDocRef, updatedRoadmap, { merge: true });
  };

  const handleArchiveMission = async (taskToArchive: Task) => {
    if (!user) return;
    const updatedTasks = tasks.filter(t => t.id !== taskToArchive.id);
    handleTasksChange(updatedTasks);

    const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
    const docSnap = await getDoc(statsDocRef);
    const stats = docSnap.exists() ? docSnap.data() : { completedMissions: 0, archivedTasks: [], unlockedAchievements: [] };

    const newCompletedCount = (stats.completedMissions || 0) + 1;
    stats.completedMissions = newCompletedCount;
    stats.archivedTasks = [...(stats.archivedTasks || []), taskToArchive];

    if (newCompletedCount >= 1) stats.unlockedAchievements.push('mission_1');
    if (newCompletedCount >= 5) stats.unlockedAchievements.push('mission_5');
    if (taskToArchive.priority === 'extreme') stats.unlockedAchievements.push('extreme_1');

    await setDoc(statsDocRef, { ...stats, unlockedAchievements: [...new Set(stats.unlockedAchievements)] }, { merge: true });
    
    toast.success(`Mission "${taskToArchive.title}" archived!`);
  };

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
              <TaskManager tasks={tasks} onTasksChange={handleTasksChange} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} onArchive={handleArchiveMission} />
            </Card>
            <AIPlanner onRoadmapChange={handleRoadmapUpdate} disabled={isNewUser} user={user} />
          </div>
          <div className="lg:col-span-6 space-y-6">
            <Card className="p-4 md:p-8 neon-border bg-card/90 backdrop-blur-sm">
              {selectedTask ? (
                <CountdownTimer key={selectedTask.id} targetDate={selectedTask.targetDate} startDate={selectedTask.startDate} title={selectedTask.title} onComplete={() => handleArchiveMission(selectedTask)} />
              ) : (
                <div className="text-center py-20">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500 animate-pulse" />
                  <h3 className="text-3xl font-black mb-2 text-red-500">NO MISSION SELECTED</h3>
                  {isNewUser && <p className="text-muted-foreground">Follow the guide in the bottom-right chat to create one.</p>}
                </div>
              )}
            </Card>
            <MotivationalQuote />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <DailyTaskCard roadmap={roadmap} selectedDay={selectedDay} onRoadmapUpdate={handleDailyTaskUpdate} currentDay={currentDay} />
            <AIAssistant
              currentRoadmap={roadmap}
              hasIncompleteTasks={hasIncompleteTasks}
              allTasksCompleted={allTasksCompleted}
              currentDay={currentDay}
              isNewUser={isNewUser}
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