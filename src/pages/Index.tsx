import { useState, useEffect } from 'react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MotivationalQuote } from '@/components/MotivationalQuote';
import { TaskManager, Task } from '@/components/TaskManager';
import AIPlanner from '@/components/AIPlanner';
import { Zap, Target, Clock, Flame, Settings, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';


const SHARED_TASKS_DOC = 'shared_tasks';

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<any | null>(null);

  useEffect(() => {
    // Authentication check
    const isAuthenticated = localStorage.getItem('authenticated');
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    const docRef = doc(db, 'tasks', SHARED_TASKS_DOC);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      console.log('Firestore docSnap.exists:', docSnap.exists());
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Firestore data:', data);
        if (data.tasks) {
          // Convert timestamps to Date objects
          const loadedTasks = data.tasks.map((task: any) => ({
            ...task,
            targetDate: task.targetDate.toDate ? task.targetDate.toDate() : new Date(task.targetDate),
            startDate: task.startDate.toDate ? task.startDate.toDate() : new Date(task.startDate),
          }));
          setTasks(loadedTasks);
          if (!selectedTaskId && loadedTasks.length > 0) {
            setSelectedTaskId(loadedTasks[0].id);
          }
        }
      } else {
        console.log('No Firestore document found, initializing default tasks');
        // Initialize with default tasks if none exist
        const defaultTasks: Task[] = [
          {
            id: '1',
            title: 'Transform My Body',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            startDate: new Date(),
            category: 'Fitness',
            priority: 'extreme',
          },
          {
            id: '2',
            title: 'Launch My Startup',
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            category: 'Business',
            priority: 'high',
          },
        ];
        setDoc(docRef, { tasks: defaultTasks }, { merge: true })
          .catch((error) => {
            console.error('Error initializing default tasks in Firestore:', error);
          });
        setTasks(defaultTasks);
        setSelectedTaskId(defaultTasks[0].id);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  const handleTasksChange = async (updatedTasks: Task[]) => {
    console.log('handleTasksChange called with:', updatedTasks);
    setTasks(updatedTasks);
    const docRef = doc(db, 'tasks', SHARED_TASKS_DOC);
    try {
      await setDoc(docRef, { tasks: updatedTasks }, { merge: true });
      console.log('Firestore updated successfully');
    } catch (error) {
      console.error('Error updating tasks in Firestore:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-primary">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header - Mobile optimized */}
      <header className="relative overflow-hidden border-b border-primary/30">
        <div className="absolute inset-0 bg-gradient-neon opacity-20"></div>
        <div className="relative container mx-auto px-4 py-6 md:py-12">
          <div className="text-center space-y-4 md:space-y-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-primary animate-pulse" />
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black gradient-text">
                DAYS COUNT DOWN
              </h1>
              <TrendingDown className="w-8 h-8 md:w-12 md:h-12 text-accent animate-pulse" />
            </div>

            <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto font-bold">
              STOP MAKING EXCUSES. START COUNTING DOWN.
            </p>

            <div className="text-lg md:text-2xl font-black text-accent neon-text">
              "TIME IS RUNNING OUT. ARE YOU?"
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-4">
              <div className="flex items-center space-x-2 text-sm md:text-base text-muted-foreground">
                <Target className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-semibold">BRUTAL COUNTDOWNS</span>
              </div>
              <div className="flex items-center space-x-2 text-sm md:text-base text-muted-foreground">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-semibold">MOCKING QUOTES</span>
              </div>
              <div className="flex items-center space-x-2 text-sm md:text-base text-muted-foreground">
                <Flame className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-semibold">NO MERCY</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Countdown Display */}
          <div className="lg:col-span-2 space-y-4 md:space-y-8">
            {/* Active Countdown */}
            <Card className="p-4 md:p-8 neon-border bg-card/90 backdrop-blur-sm">
              {selectedTask ? (
                <CountdownTimer
                  key={selectedTask.id}
                  targetDate={selectedTask.targetDate}
                  startDate={selectedTask.startDate}
                  title={selectedTask.title}
                  onComplete={() => {
                    console.log(`Mission "${selectedTask.title}" COMPLETED!`);
                  }}
                />
              ) : (
                <div className="text-center py-8 md:py-16">
                  <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-red-500 animate-pulse" />
                  <h3 className="text-2xl md:text-4xl font-black mb-2 text-red-500">NO MISSION?</h3>
                  <p className="text-lg md:text-xl text-muted-foreground font-bold mb-6">
                    YOU'RE ALREADY LOSING
                  </p>
                </div>
              )}
            </Card>

            {/* Motivational Quote */}
            <MotivationalQuote />

            {/* Aggressive Motivation Section */}
            <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-red-500/50">
              <div className="text-center space-y-4">
                <h3 className="text-2xl md:text-4xl font-black neon-text text-red-500">
                  REALITY CHECK
                </h3>
                <div className="space-y-3 text-lg md:text-xl">
                  <p className="text-muted-foreground font-bold">
                    Every second you waste is a victory for your competition.
                  </p>
                  <p className="text-accent font-black">
                    YOUR DEADLINE DOESN'T CARE ABOUT YOUR FEELINGS.
                  </p>
                  <p className="text-primary font-bold">
                    Stop reading. Start doing.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm">
              <TaskManager
                tasks={tasks}
                onTasksChange={handleTasksChange}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
              />
            </Card>

            {/* AI Planner */}
            <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm">
              <AIPlanner />
            </Card>

            {/* Daily Tasks Card */}
            <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4">Daily Tasks to Fulfill Goal</h3>
              {roadmap && roadmap.dailyTasks.length > 0 ? (
                <ul className="list-disc list-inside max-h-64 overflow-y-auto">
                  {roadmap.dailyTasks.map((task) => (
                    <li key={task.day}>
                      Day {task.day}: {task.task}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No daily tasks available. Generate a roadmap to see tasks here.</p>
              )}
            </Card>

            {/* Harsh Stats Card */}
            <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-accent/50">
              <h3 className="text-lg md:text-xl font-black neon-text mb-4">HARSH TRUTH</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Active Missions</span>
                  <span className="font-black text-primary text-xl">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Days Left</span>
                  <span className="font-black text-accent text-xl">
                    {selectedTask ? Math.floor((selectedTask.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Extreme Tasks</span>
                  <span className="font-black text-red-500 text-xl animate-pulse">
                    {tasks.filter(task => task.priority === 'extreme').length}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm font-bold text-center">
                    "Tomorrow" is not an option
                  </p>
                </div>
              </div>
            </Card>

            {/* Features Preview */}
            <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm">
              <h3 className="text-lg md:text-xl font-black neon-text mb-4">FEATURES</h3>
              <div className="space-y-3 text-sm md:text-base">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="font-semibold">Brutal countdown timers</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                  <span className="font-semibold">Aggressive reality checks</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold">No-excuse tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse"></div>
                  <span className="font-semibold">Multiple deadlines</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-neon-pink rounded-full animate-pulse"></div>
                  <span className="font-semibold">Priority management</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/30 mt-8 md:mt-16">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-black text-lg md:text-xl">DAYS COUNT DOWN</span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto font-bold">
              STOP MAKING EXCUSES. YOUR TIME IS RUNNING OUT.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground font-semibold">
              <span>"Time doesn't wait for anyone."</span>
              <span className="hidden md:inline">•</span>
              <span>"Your deadline is approaching."</span>
              <span className="hidden md:inline">•</span>
              <span>"No more tomorrow."</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
