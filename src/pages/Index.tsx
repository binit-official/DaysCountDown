import React, { useState, useEffect, useRef } from 'react';
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
import { doc, onSnapshot, setDoc, getDoc, updateDoc, runTransaction, collection, getDocs } from 'firebase/firestore';
import { AlertTriangle, Zap, Flame, Target } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { isToday, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { DashboardStats } from '@/components/DashboardStats';
import { Journal } from '@/components/Journal';
import { MoodTracker } from '@/components/MoodTracker';
import { Guiding } from '@/components/Guiding';
import { FeelingTracker } from '@/components/FeelingTracker';
import { StudyTimer, StudyLog } from '@/components/StudyTimer';
import { ALL_ACHIEVEMENTS } from '@/components/Achievements';
import { fetchWithRetry } from '@/lib/utils';
import { RoadmapPreview } from '@/components/RoadmapPreview';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
    const [stats, setStats] = useState<any>(null);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    
    const [activeTimerDetails, setActiveTimerDetails] = useState<{ day: number; subTaskIndex: number; taskText: string; logs: StudyLog[] } | null>(null);
    const [timerIsActive, setTimerIsActive] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionSecondsRef = useRef(sessionSeconds);
    const initialCheckDone = useRef(false);
    const [proposedRoadmap, setProposedRoadmap] = useState<any | null>(null);

    useEffect(() => {
        sessionSecondsRef.current = sessionSeconds;
    }, [sessionSeconds]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (timerIsActive) {
            interval = setInterval(() => {
                setSessionSeconds(seconds => seconds + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerIsActive]);

    const checkAllAchievementsOnLoad = async (currentStats: any, currentRoadmap: any) => {
        if (!user || !currentRoadmap || !currentStats) return;
        
        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
        const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
        const journalSnapshot = await getDocs(journalCollectionRef);
        const journalCount = journalSnapshot.size;

        const newAchievements = [...(currentStats.unlockedAchievements || [])];
        let changed = false;

        const addAchievement = (id: string) => {
            if (!newAchievements.includes(id)) {
                newAchievements.push(id);
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) toast.success(`Achievement Unlocked: ${achievement.name}!`);
                changed = true;
            }
        };

        if (currentRoadmap.days >= 30) addAchievement('roadmap_30_days');
        if (currentStats.totalStudyTime >= 3600) addAchievement('study_1_hour');
        if (currentStats.totalStudyTime >= 36000) addAchievement('study_10_hours');
        if (currentStats.totalStudyTime >= 180000) addAchievement('study_50_hours');
        if (currentStats.completedMissions >= 1) addAchievement('mission_1');
        if (currentStats.completedMissions >= 5) addAchievement('mission_5');
        if (currentStats.completedMissions >= 10) addAchievement('mission_10');
        if (currentStats.completedMissions >= 25) addAchievement('mission_25');
        if (currentStats.archivedTasks?.some((t: Task) => t.priority === 'extreme')) addAchievement('extreme_1');
        if (currentStats.streak >= 3) addAchievement('streak_3');
        if (currentStats.streak >= 7) addAchievement('streak_7');
        if (currentStats.streak >= 30) addAchievement('streak_30');
        if (currentStats.streak >= 100) addAchievement('streak_100');
        if (journalCount >= 1) addAchievement('journal_1');
        if (journalCount >= 7) addAchievement('journal_7_days');
        const moodLogCount = journalSnapshot.docs.reduce((acc, doc) => acc + (doc.data().moods?.length || 0), 0);
        if (moodLogCount >= 10) addAchievement('mood_10_logs');
        
        if (changed) {
            await setDoc(statsDocRef, { unlockedAchievements: [...new Set(newAchievements)] }, { merge: true });
        }
    };
    
    const handleStatEvent = async (eventType: string, data?: any) => {
        if (!user) return;
    
        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
    
        await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsDocRef);
            const currentStats = statsDoc.exists() ? statsDoc.data() : { unlockedAchievements: [], moodLogCount: 0 };
            const newAchievements = [...(currentStats.unlockedAchievements || [])];
    
            const addAchievement = (id: string) => {
                if (!newAchievements.includes(id)) {
                    newAchievements.push(id);
                    const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                    if(achievement) toast.success(`Achievement Unlocked: ${achievement.name}!`);
                }
            };
    
            if (eventType === 'roadmap_generated' && data.days >= 30) {
                addAchievement('roadmap_30_days');
            }
    
            if (eventType === 'feedback_used') {
                addAchievement('feedback_1');
            }
    
            if (eventType === 'journal_saved') {
                const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
                const journalSnapshot = await getDocs(journalCollectionRef);
                const journalCount = journalSnapshot.size;
    
                if (journalCount >= 1) addAchievement('journal_1');
                if (journalCount >= 7) addAchievement('journal_7_days');
            }
    
            if (eventType === 'mood_logged') {
                const newMoodCount = (currentStats.moodLogCount || 0) + 1;
                transaction.set(statsDocRef, { moodLogCount: newMoodCount }, { merge: true });
                if (newMoodCount >= 10) addAchievement('mood_10_logs');
            }
    
            if (eventType === 'task_completed' && roadmap) {
                const now = new Date();
                if (now.getHours() < 8) addAchievement('early_bird');
                if (now.getHours() >= 22) addAchievement('night_owl');
                if (data.difficulty === 'Challenge') addAchievement('challenge_task_1');
    
                const weekStart = startOfWeek(now, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
                
                const allTasksInWeek = roadmap.dailyTasks.filter((task: any) => {
                    const taskDate = new Date(roadmap.startDate);
                    taskDate.setDate(taskDate.getDate() + task.day - 1);
                    return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
                });

                if (allTasksInWeek.length > 0 && allTasksInWeek.every((task:any) => task.completed)) {
                    addAchievement('perfect_week');
                }
            }

            transaction.set(statsDocRef, { unlockedAchievements: [...new Set(newAchievements)] }, { merge: true });
        });
    };

    const handleRoadmapUpdate = (newRoadmap: any) => {
        if (!user) return;
        setRoadmap(newRoadmap);
        const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
        setDoc(roadmapDocRef, newRoadmap, { merge: true });
    };

    const updateTasksAndStatsAtomically = async (day: number, subTaskIndex: number, newLog?: StudyLog, deleteLogId?: string, editLog?: {id: string, duration: number}) => {
        if (!user) return;
        
        const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');

        try {
            await runTransaction(db, async (transaction) => {
                const roadmapDoc = await transaction.get(roadmapDocRef);
                const statsDoc = await transaction.get(statsDocRef);

                if (!roadmapDoc.exists()) throw "Roadmap does not exist!";
                
                const currentRoadmap = roadmapDoc.data();
                const updatedDailyTasks = currentRoadmap.dailyTasks.map((task: any) => {
                    if (task.day === day) {
                        const subTasks = task.task.split(';').map((s: string, i: number) => ({
                            text: s.trim(),
                            completed: task.subTasks?.[i]?.completed ?? false,
                            studyLogs: task.subTasks?.[i]?.studyLogs ?? [],
                        }));
                        
                        let currentLogs = subTasks[subTaskIndex].studyLogs || [];
                        if (newLog) currentLogs.push(newLog);
                        if (deleteLogId) currentLogs = currentLogs.filter((log: StudyLog) => log.id !== deleteLogId);
                        if (editLog) {
                            currentLogs = currentLogs.map((log: StudyLog) => log.id === editLog.id ? {...log, duration: editLog.duration} : log);
                        }
                        
                        subTasks[subTaskIndex].studyLogs = currentLogs;
                        return { ...task, subTasks };
                    }
                    return task;
                });

                transaction.update(roadmapDocRef, { dailyTasks: updatedDailyTasks });

                const newTotalStudyTime = updatedDailyTasks.reduce((total: number, task: any) => {
                    return total + (task.subTasks?.reduce((subTotal: number, sub: any) => subTotal + (sub.studyLogs?.reduce((logTotal: number, log: StudyLog) => logTotal + log.duration, 0) || 0), 0) || 0);
                }, 0);

                const currentStats = statsDoc.exists() ? statsDoc.data() : { unlockedAchievements: [] };
                const newAchievements = [...(currentStats.unlockedAchievements || [])];
                
                const addAchievement = (id: string) => {
                    if (!newAchievements.includes(id)) {
                        newAchievements.push(id);
                        const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                        if(achievement) toast.success(`Achievement Unlocked: ${achievement.name}!`);
                    }
                };
                
                if (newTotalStudyTime >= 3600) addAchievement('study_1_hour');
                if (newTotalStudyTime >= 36000) addAchievement('study_10_hours');
                if (newTotalStudyTime >= 180000) addAchievement('study_50_hours');
                if (newLog && newLog.duration >= 7200) addAchievement('study_marathon');

                const statsUpdate: any = { 
                    totalStudyTime: newTotalStudyTime,
                    unlockedAchievements: [...new Set(newAchievements)]
                };
                
                transaction.set(statsDocRef, statsUpdate, { merge: true });
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
            toast.error("Failed to save session. Please try again.");
        }
    };

    const handleSaveSession = () => {
        if (sessionSecondsRef.current > 0 && activeTimerDetails) {
            const { day, subTaskIndex } = activeTimerDetails;
            const newLog: StudyLog = { id: Date.now().toString(), duration: sessionSecondsRef.current, timestamp: new Date() };
            updateTasksAndStatsAtomically(day, subTaskIndex, newLog);
            setSessionSeconds(0);
            sessionSecondsRef.current = 0;
            return true;
        }
        return false;
    };
    
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (timerIsActive && sessionSecondsRef.current > 0) {
                handleSaveSession();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [timerIsActive, activeTimerDetails, stats]);

    const handleOpenTimer = (day: number, subTaskIndex: number, taskText: string, logs: StudyLog[]) => {
        setActiveTimerDetails({ day, subTaskIndex, taskText, logs });
    };

    const handleCloseTimer = () => {
        if (timerIsActive) {
           setTimerIsActive(false);
           handleSaveSession();
        }
        setActiveTimerDetails(null);
    };
    
    const handleEditStudyLog = (logId: string, newDuration: number) => {
        if (!activeTimerDetails) return;
        const { day, subTaskIndex } = activeTimerDetails;
        updateTasksAndStatsAtomically(day, subTaskIndex, undefined, undefined, {id: logId, duration: newDuration});
    };

    const handleDeleteStudyLog = (logId: string) => {
        if (!activeTimerDetails) return;
        const { day, subTaskIndex } = activeTimerDetails;
        updateTasksAndStatsAtomically(day, subTaskIndex, undefined, logId);
    };
    
    useEffect(() => {
        const calculateCurrentDay = (startDate: Date | undefined) => {
            if (startDate && typeof startDate.getTime === 'function') {
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
        if (user && stats && roadmap && !loading && !initialCheckDone.current) {
            const check = async () => {
                await checkAllAchievementsOnLoad(stats, roadmap);
                initialCheckDone.current = true;
            };
            check();
        }
    }, [user, stats, roadmap, loading]);

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
                    targetDate: task.targetDate?.toDate(),
                    startDate: task.startDate?.toDate(),
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
                
                const toValidDate = (d: any) => {
                    if (!d) return null;
                    if (d.toDate) return d.toDate();
                    if (d instanceof Date) return d;
                    const parsed = new Date(d);
                    return isNaN(parsed.getTime()) ? null : parsed;
                };

                const convertedDailyTasks = data.dailyTasks?.map((task: any) => ({
                    ...task,
                    subTasks: task.subTasks?.map((sub: any) => ({
                        ...sub,
                        studyLogs: sub.studyLogs?.map((log: any) => ({
                            ...log,
                            timestamp: toValidDate(log.timestamp),
                        })) || [],
                    })) || [],
                }));
                const newRoadmap = { 
                    ...data, 
                    startDate: toValidDate(data.startDate),
                    dailyTasks: convertedDailyTasks 
                };
                setRoadmap(newRoadmap);
            } else {
                setRoadmap(null);
            }
        });

        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
        const unsubscribeStats = onSnapshot(statsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const lastCompleted = data.lastCompleted?.toDate();
                if (lastCompleted && !isToday(lastCompleted) && !isYesterday(lastCompleted)) {
                    updateDoc(statsDocRef, { streak: 0 });
                }
                setStats(data);
                setUnlockedAchievements(data.unlockedAchievements || []);
            }
        });

        return () => {
            unsubscribeTasks();
            unsubscribeRoadmap();
            unsubscribeStats();
        };
    }, [user]);

    const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
    const isNewUser = tasks.length === 0 && !loading;

    const handleTasksChange = async (updatedTasks: Task[]) => {
        if (!user) return;
        setTasks(updatedTasks);
        const docRef = doc(db, 'users', user.uid, 'data', 'tasks');
        await setDoc(docRef, { tasks: updatedTasks }, { merge: true });
    };

    const checkStreaksAndAchievements = async () => {
        if (!user) return;
        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
        const docSnap = await getDoc(statsDocRef);
        const currentStats = docSnap.exists() ? docSnap.data() : { streak: 0, lastCompleted: null, unlockedAchievements: [] };

        const lastCompletedDate = currentStats.lastCompleted?.toDate();

        if (lastCompletedDate && isToday(lastCompletedDate)) return;

        const newStreak = (lastCompletedDate && isYesterday(lastCompletedDate))
            ? (currentStats.streak || 0) + 1
            : 1;

        const newAchievements = [...(currentStats.unlockedAchievements || [])];
        const addAchievement = (id: string) => {
            if (!newAchievements.includes(id)) {
                newAchievements.push(id);
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                if(achievement) toast.success(`Achievement Unlocked: ${achievement.name}!`);
            }
        };

        if (newStreak >= 3) addAchievement('streak_3');
        if (newStreak >= 7) addAchievement('streak_7');
        if (newStreak >= 30) addAchievement('streak_30');
        if (newStreak >= 100) addAchievement('streak_100');

        await setDoc(statsDocRef, { 
            ...currentStats,
            streak: newStreak,
            lastCompleted: new Date(),
            unlockedAchievements: [...new Set(newAchievements)],
        }, { merge: true });
        
        toast.success(`🔥 Streak extended to ${newStreak} days!`);
    };

    const revertStreakForToday = async () => {
        if (!user) return;
        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
        const docSnap = await getDoc(statsDocRef);
        if (!docSnap.exists()) return;

        const currentStats = docSnap.data();
        const lastCompletedDate = currentStats.lastCompleted?.toDate();

        if (lastCompletedDate && isToday(lastCompletedDate)) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const newStreak = (currentStats.streak || 1) - 1;
            await updateDoc(statsDocRef, {
                streak: newStreak,
                lastCompleted: currentStats.streak > 1 ? yesterday : null
            });
            toast.info("Streak reverted for today.");
        }
    };
    
    const handleDailyTaskUpdate = async (updatedDailyTasks: any[], completedTask?: any) => {
        if (!user || !roadmap) return;
    
        const wasAllTodayComplete = roadmap.dailyTasks
            .filter((t: any) => t.day === currentDay)
            .every((t: any) => t.completed);
    
        const isAllTodayComplete = updatedDailyTasks
            .filter(t => t.day === currentDay)
            .every(t => t.completed);
    
        if (isAllTodayComplete && !wasAllTodayComplete) {
            await checkStreaksAndAchievements();
        } else if (!isAllTodayComplete && wasAllTodayComplete) {
            await revertStreakForToday();
        }

        if (completedTask) {
            handleStatEvent('task_completed', { difficulty: completedTask.difficulty });
        }
        
        handleRoadmapUpdate({ ...roadmap, dailyTasks: updatedDailyTasks }); 
    };

    const handleArchiveMission = async (taskToArchive: Task) => {
        if (!user) return;
        const updatedTasks = tasks.filter(t => t.id !== taskToArchive.id);
        handleTasksChange(updatedTasks);

        const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
        const docSnap = await getDoc(statsDocRef);
        const statsData = docSnap.exists() ? docSnap.data() : { completedMissions: 0, archivedTasks: [], unlockedAchievements: [] };
        
        const newCompletedCount = (statsData.completedMissions || 0) + 1;
        
        const newAchievements = [...(statsData.unlockedAchievements || [])];
        if (newCompletedCount >= 1) newAchievements.push('mission_1');
        if (newCompletedCount >= 5) newAchievements.push('mission_5');
        if (newCompletedCount >= 10) newAchievements.push('mission_10');
        if (newCompletedCount >= 25) newAchievements.push('mission_25');
        if (taskToArchive.priority === 'extreme') newAchievements.push('extreme_1');

        await setDoc(statsDocRef, { 
            completedMissions: newCompletedCount,
            archivedTasks: [...(statsData.archivedTasks || []), taskToArchive],
            unlockedAchievements: [...new Set(newAchievements)] 
        }, { merge: true });

        toast.success(`Mission "${taskToArchive.title}" archived!`);
    };
    
    const handleInfuseTasks = () => {
        if (!roadmap) return;
        
        const updatedDailyTasks = JSON.parse(JSON.stringify(roadmap.dailyTasks));
    
        const incompleteSubTasks: any[] = [];
        updatedDailyTasks.forEach((task: any) => {
            if (task.day < currentDay && !task.completed) {
                const subTasks = (task.subTasks && task.subTasks.length > 0)
                    ? task.subTasks
                    : task.task.split(';').map((t: string) => ({ text: t.trim(), completed: false }));
    
                const missed = subTasks.filter((sub: any) => !sub.completed);
                incompleteSubTasks.push(...missed.map((sub: any) => ({ ...sub, text: `[Recovery] ${sub.text}` })));
            }
        });
    
        if (incompleteSubTasks.length === 0) {
            toast.info("No incomplete tasks to infuse!");
            return;
        }
    
        const futureDays = updatedDailyTasks.filter((task: any) => task.day >= currentDay);
        const easyAndMediumDays = futureDays.filter((d: any) => d.difficulty === 'Easy' || d.difficulty === 'Medium');
    
        if (easyAndMediumDays.length === 0) {
            toast.error("No 'Easy' or 'Medium' future days available to add tasks.");
            return;
        }
    
        incompleteSubTasks.forEach((missedTask: any, index: number) => {
            const targetDay = easyAndMediumDays[index % easyAndMediumDays.length];
            targetDay.task = `${targetDay.task}; ${missedTask.text}`;
        });
    
        setProposedRoadmap({ ...roadmap, dailyTasks: updatedDailyTasks });
    };

    const handleReplanWithAI = async () => {
        if (!roadmap || !user) return;
        setLoading(true);
        toast.info("Asking Nyx to generate a new plan...");

        const incompleteTasks = roadmap.dailyTasks
            .filter((task: any) => task.day < currentDay && !task.completed)
            .map((task: any) => `Day ${task.day} (Incomplete): ${task.task}`);

        const futureTasks = roadmap.dailyTasks
            .filter((task: any) => task.day >= currentDay)
            .map((task: any) => `Day ${task.day} (Planned): ${task.task}`);

        const remainingDays = roadmap.days - currentDay + 1;
        if (remainingDays <= 0) {
            toast.error("No remaining days to re-plan.");
            setLoading(false);
            return;
        }

        const prompt = `
            You are an expert project manager. A user is working towards the goal: "${roadmap.goal}".
            They have fallen behind. Here is a list of their incomplete tasks from past days:
            ${incompleteTasks.join('\n')}

            Here is a list of their future planned tasks:
            ${futureTasks.join('\n')}

            Your task is to create a new, realistic, and optimized roadmap for the remaining ${remainingDays} days.
            This new plan should intelligently combine and reschedule ALL of the incomplete and future tasks.
            The new plan must start from Day ${currentDay}.

            For each day, provide a detailed, multi-part task using semicolons as a delimiter.
            Also, provide a difficulty rating: 'Easy', 'Medium', 'Hard', or 'Challenge'.

            Respond ONLY with a valid JSON array of objects. The array must contain exactly ${remainingDays} objects. Each object must have three fields: "day", "task", and "difficulty".
            The "day" field must be a number, starting from ${currentDay}.
        `;

        try {
            const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) throw new Error("AI failed to generate a new plan.");

            const cleanedContent = content.replace(/```json\n?|```/g, '').trim();
            const newDailyTasks = JSON.parse(cleanedContent);

            const newRoadmap = {
                ...roadmap,
                dailyTasks: [
                    ...roadmap.dailyTasks.filter((t: any) => t.day < currentDay),
                    ...newDailyTasks.map((item: any) => ({ ...item, completed: false }))
                ]
            };
            setProposedRoadmap(newRoadmap);
        } catch (e: any) {
            toast.error(`Failed to re-plan: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveChanges = () => {
        if(proposedRoadmap){
            const updatedRoadmap = JSON.parse(JSON.stringify(proposedRoadmap));
            updatedRoadmap.dailyTasks.forEach((task: any) => {
                if (task.day < currentDay && !task.completed) {
                    task.completed = true;
                }
            });
            handleRoadmapUpdate(updatedRoadmap);
            toast.success("Your roadmap has been updated!");
            setProposedRoadmap(null);
        }
    };
    
    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-primary">
                <Zap className="w-8 h-8 mr-4 animate-spin" />
                Loading Mission Control...
            </div>
        );
    }

    const totalLoggedTimeForActiveTimer = activeTimerDetails?.logs.reduce((acc, log) => acc + log.duration, 0) || 0;

    return (
        <div className="min-h-screen bg-background flex flex-col">
             {timerIsActive && (
                <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
             )}
            
            <header className="relative z-10 border-b border-primary/20 bg-background/50 backdrop-blur-sm">
                <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(hsl(var(--primary)/0.1)_1px,transparent_1px)] [background-size:16px_16px]"></div>
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
                        <Journal onJournalSave={() => handleStatEvent('journal_saved')} />
                        <AIPlanner onRoadmapChange={handleRoadmapUpdate} onRoadmapGenerate={(days) => handleStatEvent('roadmap_generated', { days })} disabled={isNewUser} user={user} />
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
                        <DailyTaskCard 
                            roadmap={roadmap} 
                            selectedDay={selectedDay} 
                            onRoadmapUpdate={handleDailyTaskUpdate} 
                            currentDay={currentDay} 
                            onOpenTimer={handleOpenTimer}
                        />
                        <DashboardStats stats={stats} unlockedAchievements={unlockedAchievements} />
                        <MoodTracker onMoodLog={() => handleStatEvent('mood_logged')} />
                        <Guiding />
                    </div>
                </div>
                <div className="mt-8">
                    <FeelingTracker />
                </div>

                <div className="mt-8 lg:mt-12">
                    <Roadmap roadmap={roadmap} selectedDay={selectedDay} onSelectDay={setSelectedDay} currentDay={currentDay} />
                </div>
                <AIAssistant
                    currentRoadmap={roadmap}
                    hasIncompleteTasks={hasIncompleteTasks}
                    allTasksCompleted={allTasksCompleted}
                    currentDay={currentDay}
                    isNewUser={isNewUser}
                    onInfuseTasks={handleInfuseTasks}
                    onReplan={handleReplanWithAI}
                />
            </main>

            <Footer />

            {activeTimerDetails && (
                 <StudyTimer
                    taskText={activeTimerDetails.taskText}
                    elapsedSeconds={sessionSeconds}
                    totalLoggedTime={totalLoggedTimeForActiveTimer}
                    isActive={timerIsActive}
                    setIsActive={setTimerIsActive}
                    studyLogs={activeTimerDetails.logs}
                    onSaveSession={handleSaveSession}
                    onEditLog={handleEditStudyLog}
                    onDeleteLog={handleDeleteStudyLog}
                    onClose={handleCloseTimer}
                 />
            )}

            {proposedRoadmap && (
                <RoadmapPreview
                    proposedRoadmap={proposedRoadmap}
                    onCancel={() => setProposedRoadmap(null)}
                    onApprove={handleApproveChanges}
                    currentDay={currentDay}
                />
            )}
        </div>
    );
};

export default Index;