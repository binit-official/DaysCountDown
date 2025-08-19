import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { MotivationalQuote } from '@/components/MotivationalQuote';
import TaskManager, { Task } from '@/components/TaskManager';
import AIPlanner from '@/components/AIPlanner';
import { AIAssistant } from '@/components/AIAssistant';
import { DailyTaskCard } from '@/components/DailyTaskCard';
import { Roadmap } from '@/components/Roadmap';
import { Logo } from '@/components/Logo';
import { UserNav } from '@/components/UserNav';
import { Card } from '@/components/ui/card';
// FIX: Import Button for dialog usage
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, runTransaction, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { AlertTriangle, Zap, Flame, Target } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { DashboardStats } from '@/components/DashboardStats';
import { Journal } from '@/components/Journal';
import { MoodTracker } from '@/components/MoodTracker';
import { Guiding } from '@/components/Guiding';
import { FeelingTracker } from '@/components/FeelingTracker';
import { StudyTimer, StudyLog } from '@/components/StudyTimer';
import { ALL_ACHIEVEMENTS } from '@/components/Achievements';
import { fetchWithFallback } from '@/lib/utils';
import { RoadmapPreview } from '@/components/RoadmapPreview';
import { StickyNotes } from '@/components/StickyNotes';
import { AIBubble } from '@/components/AIBubble'; // NEW IMPORT

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY_2 = import.meta.env.VITE_GEMINI_API_KEY_2;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

const Index = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [currentDay, setCurrentDay] = useState<number>(1);
    const [hasIncompleteTasks, setHasIncompleteTasks] = useState(false);
    const [allTasksCompleted, setAllTasksCompleted] = useState(false);
    const [stats, setStats] = useState<any>(null);
    
    const [activeTimerDetails, setActiveTimerDetails] = useState<{ day: number; subTaskIndex: number; taskText: string; logs: StudyLog[] } | null>(null);
    const [timerIsActive, setTimerIsActive] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const sessionSecondsRef = useRef(sessionSeconds);
    const initialCheckDone = useRef(false);
    const [proposedRoadmap, setProposedRoadmap] = useState<any | null>(null);

    const [journalEntries, setJournalEntries] = useState<any[]>([]);
    const [moodAndFeelingData, setMoodAndFeelingData] = useState<any>({});

    const [isNyxAssistantOpen, setIsNyxAssistantOpen] = useState(false);
    const [isGuidingOpen, setIsGuidingOpen] = useState(false);

    // Optimized break day logic: only shift one day, no extra empty/break days
    const [breakDays, setBreakDays] = useState<number[]>([]);

    // Remove the textarea from the main page and show it only in a dialog when replan is triggered
    const [showReplanDialog, setShowReplanDialog] = useState(false);
    const [customReplanPrompt, setCustomReplanPrompt] = useState<string>("");

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

    const updateAchievements = async (newRoadmap: any, newStats: any) => {
        if (!user || !newRoadmap || !newStats) return;

        const currentAchievements = new Set(newStats.unlockedAchievements || []);
        let changed = false;

        const checkAndToggleAchievement = (id: string, condition: boolean) => {
            const hasAchievement = currentAchievements.has(id);
            if (condition && !hasAchievement) {
                currentAchievements.add(id);
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) toast.success(`Achievement Unlocked: ${achievement.name}!`);
                changed = true;
            } else if (!condition && hasAchievement) {
                currentAchievements.delete(id);
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) toast.info(`Achievement Locked: ${achievement.name}`);
                changed = true;
            }
        };
        
        const now = new Date();
        const areTodaysTasksComplete = newRoadmap.dailyTasks
            .filter((t: any) => t.day === currentDay)
            .every((t: any) => t.completed);

        checkAndToggleAchievement('early_bird', areTodaysTasksComplete && now.getHours() < 8);
        checkAndToggleAchievement('night_owl', areTodaysTasksComplete && now.getHours() >= 22);
        
        if (newRoadmap.startDate) {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            const tasksInWeek = newRoadmap.dailyTasks
                .filter((task: any) => {
                    const taskDate = new Date(newRoadmap.startDate);
                    taskDate.setDate(taskDate.getDate() + task.day - 1);
                    return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
                });
            
            if (tasksInWeek.length > 0) {
                 checkAndToggleAchievement('perfect_week', tasksInWeek.every((task: any) => task.completed));
            }
        }

        const addPermanentAchievement = (id: string) => {
            if (!currentAchievements.has(id)) {
                currentAchievements.add(id);
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                if (achievement) toast.success(`Achievement Unlocked: ${achievement.name}!`);
                changed = true;
            }
        };

        if (newRoadmap.days >= 30) addPermanentAchievement('roadmap_30_days');
        if (newStats.totalStudyTime >= 3600) addPermanentAchievement('study_1_hour');
        if (newStats.completedMissions >= 1) addPermanentAchievement('mission_1');
        if (newStats.streak >= 3) addPermanentAchievement('streak_3');

        if (changed) {
            const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
            await setDoc(statsDocRef, { unlockedAchievements: Array.from(currentAchievements) }, { merge: true });
        }
    };
    
    useEffect(() => {
        if (user && stats && roadmap && !loading && !initialCheckDone.current) {
            const check = async () => {
                await updateAchievements(roadmap, stats);
                initialCheckDone.current = true;
            };
            check();
        }
    }, [user, stats, roadmap, loading]);

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
    
            if (eventType === 'roadmap_generated' && data.days >= 30) addAchievement('roadmap_30_days');
            if (eventType === 'feedback_used' ) addAchievement('feedback_1');
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

            transaction.set(statsDocRef, { unlockedAchievements: [...new Set(newAchievements)] }, { merge: true });
        });
    };

    const handleRoadmapUpdate = (newRoadmap: any) => {
        if (!user) return;
        setRoadmap(newRoadmap);
        const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
        const roadmapForFirebase = {
            ...newRoadmap,
            startDate: newRoadmap.startDate ? newRoadmap.startDate : null,
        };
        setDoc(roadmapDocRef, roadmapForFirebase, { merge: true });
    };
    
    const handleSetRoadmapStartDate = (date: Date) => {
        if (!roadmap) return;
        const newRoadmap = { ...roadmap, startDate: date };
        handleRoadmapUpdate(newRoadmap);
        toast.success("Roadmap started! Your first day is set.");
    };

    const handleShiftRoadmap = (newStartDate: Date) => {
        if (!roadmap) return;
        const newRoadmap = { ...roadmap, startDate: newStartDate };
        handleRoadmapUpdate(newRoadmap);
        toast.success("Roadmap dates have been shifted.");
    };

    const handleRelocateSubTask = (sourceDay: number, taskIndex: number, destinationDay: number) => {
        if (!roadmap || sourceDay === destinationDay) return;

        const updatedDailyTasks = JSON.parse(JSON.stringify(roadmap.dailyTasks));
        const sourceTask = updatedDailyTasks.find((t:any) => t.day === sourceDay);
        const destTask = updatedDailyTasks.find((t:any) => t.day === destinationDay);
        if (!sourceTask || !destTask) return;
        
        if (!sourceTask.subTasks || sourceTask.subTasks.length === 0) {
            sourceTask.subTasks = sourceTask.task.split(';').map((t: string) => ({text: t.trim(), completed: false}));
        }
        if (!destTask.subTasks || destTask.subTasks.length === 0) {
            destTask.subTasks = destTask.task.split(';').map((t: string) => ({text: t.trim(), completed: false}));
        }

        const [relocatedTask] = sourceTask.subTasks.splice(taskIndex, 1);
        destTask.subTasks.push(relocatedTask);
        sourceTask.task = sourceTask.subTasks.map((t:any) => t.text).join('; ');
        destTask.task = destTask.subTasks.map((t:any) => t.text).join('; ');
        if(sourceTask.subTasks.length === 0) sourceTask.completed = true;

        handleRoadmapUpdate({ ...roadmap, dailyTasks: updatedDailyTasks });
        toast.success(`Task relocated from Day ${sourceDay} to Day ${destinationDay}.`);
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

    // FIX: StudyTimer logging bug - ensure logs are appended to the correct subtask and update UI
    const handleSaveSession = () => {
        if (sessionSecondsRef.current > 0 && activeTimerDetails) {
            const { day, subTaskIndex } = activeTimerDetails;
            const newLog: StudyLog = { id: Date.now().toString(), duration: sessionSecondsRef.current, timestamp: new Date() };
            // Ensure logs are appended to the correct subtask and update UI immediately
            if (roadmap) {
                const updatedDailyTasks = roadmap.dailyTasks.map((task: any) => {
                    if (task.day === day) {
                        // Ensure subTasks exist
                        let subTasks = task.subTasks;
                        if (!subTasks || subTasks.length === 0) {
                            subTasks = task.task.split(';').map((t: string) => ({
                                text: t.trim(),
                                completed: false,
                                studyLogs: []
                            }));
                        }
                        // Append log to correct subtask
                        subTasks = subTasks.map((sub: any, idx: number) => {
                            if (idx === subTaskIndex) {
                                return {
                                    ...sub,
                                    studyLogs: [...(sub.studyLogs || []), newLog]
                                };
                            }
                            return sub;
                        });
                        return { ...task, subTasks };
                    }
                    return task;
                });
                setRoadmap({ ...roadmap, dailyTasks: updatedDailyTasks });
            }
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
        // Update UI immediately for edit
        if (roadmap) {
            const updatedDailyTasks = roadmap.dailyTasks.map((task: any) => {
                if (task.day === day) {
                    let subTasks = task.subTasks;
                    if (!subTasks || subTasks.length === 0) {
                        subTasks = task.task.split(';').map((t: string) => ({
                            text: t.trim(),
                            completed: false,
                            studyLogs: []
                        }));
                    }
                    subTasks = subTasks.map((sub: any, idx: number) => {
                        if (idx === subTaskIndex) {
                            return {
                                ...sub,
                                studyLogs: (sub.studyLogs || []).map((log: StudyLog) =>
                                    log.id === logId ? { ...log, duration: newDuration } : log
                                )
                            };
                        }
                        return sub;
                    });
                    return { ...task, subTasks };
                }
                return task;
            });
            setRoadmap({ ...roadmap, dailyTasks: updatedDailyTasks });
        }
        updateTasksAndStatsAtomically(day, subTaskIndex, undefined, undefined, { id: logId, duration: newDuration });
    };

    const handleDeleteStudyLog = (logId: string) => {
        if (!activeTimerDetails) return;
        const { day, subTaskIndex } = activeTimerDetails;
        // Update UI immediately for delete
        if (roadmap) {
            const updatedDailyTasks = roadmap.dailyTasks.map((task: any) => {
                if (task.day === day) {
                    let subTasks = task.subTasks;
                    if (!subTasks || subTasks.length === 0) {
                        subTasks = task.task.split(';').map((t: string) => ({
                            text: t.trim(),
                            completed: false,
                            studyLogs: []
                        }));
                    }
                    subTasks = subTasks.map((sub: any, idx: number) => {
                        if (idx === subTaskIndex) {
                            return {
                                ...sub,
                                studyLogs: (sub.studyLogs || []).filter((log: StudyLog) => log.id !== logId)
                            };
                        }
                        return sub;
                    });
                    return { ...task, subTasks };
                }
                return task;
            });
            setRoadmap({ ...roadmap, dailyTasks: updatedDailyTasks });
        }
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
                return day; 
            }
            return 1;
        };

        if (roadmap?.startDate) {
            const day = calculateCurrentDay(roadmap.startDate);
            setCurrentDay(day > 0 ? day : 1);
            if (selectedDay < day || day > 0) {
                setSelectedDay(day > 0 ? day : 1);
            }
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
                    targetDate: task.targetDate?.toDate(),
                    startDate: task.startDate?.toDate(),
                }));
                setTasks(loadedTasks);
                if (!selectedTaskId && loadedTasks.length > 0) setSelectedTaskId(loadedTasks[0].id);
            } else {
                setTasks([]);
            }
            setLoading(false);
        });

        const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
        const unsubscribeRoadmap = onSnapshot(roadmapDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const toValidDate = (d: any) => d?.toDate ? d.toDate() : (d ? new Date(d) : null);
                setRoadmap({ ...data, startDate: toValidDate(data.startDate) });
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
            } else {
                setDoc(statsDocRef, { streak: 0, maxStreak: 0, completedMissions: 0, totalStudyTime: 0, unlockedAchievements: [] });
            }
        });

        const journalQuery = query(collection(db, 'users', user.uid, 'journal'), orderBy('date', 'desc'), limit(10));
        const unsubscribeJournal = onSnapshot(journalQuery, (snapshot) => {
            setJournalEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const moodDocRef = doc(db, 'users', user.uid, 'data', 'moods');
        const unsubscribeMoods = onSnapshot(moodDocRef, (docSnap) => {
            if(docSnap.exists()) setMoodAndFeelingData(docSnap.data());
        });
        // FIX: Also fetch today's journal doc for latest moods/feelings
        const todayDateString = (new Date()).toISOString().slice(0,10);
        const todayJournalDocRef = doc(db, 'users', user.uid, 'journal', todayDateString);
        const unsubscribeTodayJournal = onSnapshot(todayJournalDocRef, (docSnap) => {
            if(docSnap.exists()) {
                setMoodAndFeelingData((prev: any) => ({
                    ...prev,
                    moods: docSnap.data().moods || prev?.moods || [],
                    feelings: docSnap.data().feelings || prev?.feelings || [],
                }));
            }
        });

        return () => {
            unsubscribeTasks();
            unsubscribeRoadmap();
            unsubscribeStats();
            unsubscribeJournal();
            unsubscribeMoods();
            unsubscribeTodayJournal();
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
        if (!user || !stats || !roadmap) return;
        await runTransaction(db, async (transaction) => {
            const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
            const statsDoc = await transaction.get(statsDocRef);
            if (!statsDoc.exists()) return;

            const currentStats = statsDoc.data();
            const lastCompletedDate = currentStats.lastCompleted?.toDate();
            const today = startOfDay(new Date());
            const lastCompletedDay = lastCompletedDate ? startOfDay(lastCompletedDate) : null;
            let newStreak = 1;
            if (lastCompletedDay) {
                const diffDays = Math.floor((today.getTime() - lastCompletedDay.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    newStreak = (currentStats.streak || 0) + 1;
                } else if (diffDays === 0) {
                    newStreak = currentStats.streak || 1;
                } else {
                    newStreak = 1;
                }
            }
            // FIX: Only update maxStreak if streak is increased AND it's the end of the day
            // Do NOT update maxStreak instantly when streak increases
            let newMaxStreak = currentStats.maxStreak || 0;
            // Only update maxStreak if streak is increased AND it's the end of the day AND today is after lastCompletedDay
            const isEndOfDay = new Date().getHours() >= 23; // You can adjust this threshold as needed
            if (isEndOfDay && newStreak > newMaxStreak && lastCompletedDay && today > lastCompletedDay) {
                newMaxStreak = newStreak;
            }

            transaction.update(statsDocRef, { streak: newStreak, maxStreak: newMaxStreak, lastCompleted: today });

            await updateAchievements(roadmap, { ...currentStats, streak: newStreak });
            toast.success(`🔥 Streak extended to ${newStreak} days!`);
        });
    };
    
    const revertStreakForToday = async () => {
        if (!user || !stats || !roadmap) return;
        await runTransaction(db, async (transaction) => {
            const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
            const statsDoc = await transaction.get(statsDocRef);
            if (!statsDoc.exists()) return;

            const currentStats = statsDoc.data();
            const lastCompletedDate = currentStats.lastCompleted?.toDate();

            if (lastCompletedDate && isToday(lastCompletedDate)) {
                const yesterday = startOfDay(new Date());
                yesterday.setDate(yesterday.getDate() - 1);
                const newStreak = (currentStats.streak || 1) - 1;
                transaction.update(statsDocRef, {
                    streak: newStreak > 0 ? newStreak : 0,
                    lastCompleted: newStreak > 0 ? yesterday : null
                });

                await updateAchievements(roadmap, { ...currentStats, streak: newStreak });
                toast.info("Streak reverted for today.");
            }
        });
    };
    
    const handleDailyTaskUpdate = async (updatedDailyTasks: any[], completedTask?: any) => {
        if (!user || !roadmap || !stats) return;

        const wasAllTodayComplete = roadmap.dailyTasks.filter((t: any) => t.day === currentDay).every((t: any) => t.completed);
        const newRoadmapState = { ...roadmap, dailyTasks: updatedDailyTasks };
        const isAllTodayComplete = updatedDailyTasks.filter(t => t.day === currentDay).every(t => t.completed);
    
        if (isAllTodayComplete && !wasAllTodayComplete) {
            await checkStreaksAndAchievements();
        } else if (!isAllTodayComplete && wasAllTodayComplete) {
            await revertStreakForToday();
        }

        await updateAchievements(newRoadmapState, stats);
        handleRoadmapUpdate(newRoadmapState); 
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

    // Modified replan handler: open dialog first
    const handleReplanClick = () => {
        setShowReplanDialog(true);
    };

    // Show RoadmapPreview for confirmation before updating database
    const handleApproveChanges = () => {
        if (proposedRoadmap) {
            handleRoadmapUpdate(proposedRoadmap);
            toast.success("Your roadmap has been updated!");
            setProposedRoadmap(null);
        }
    };

    const handleCancelChanges = () => {
        setProposedRoadmap(null);
    };

    // Actual AI replan logic, called after dialog confirm
    const handleReplanWithAI = async () => {
        setShowReplanDialog(false);
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

            Additional customization or instructions from the user:
            ${customReplanPrompt}

            Your task is to create a new, realistic, and optimized roadmap for the remaining ${remainingDays} days.
            This new plan should intelligently combine and reschedule ALL of the incomplete and future tasks.
            The new plan must start from Day ${currentDay}.

            For each day, provide a detailed, multi-part task using semicolons as a delimiter.
            Also, provide a difficulty rating: 'Easy', 'Medium', 'Hard', or 'Challenge'.

            Respond ONLY with a valid JSON array of objects. The array must contain exactly ${remainingDays} objects. Each object must have three fields: "day", "task", and "difficulty".
            The "day" field must be a number, starting from ${currentDay}.
        `;

        try {
            const response = await fetchWithFallback(
                API_BASE_URL,
                GEMINI_API_KEY,
                GEMINI_API_KEY_2,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                },
                (message) => toast.info(message)
            );
            
            if (!response.ok) {
                if (response.status === 429) throw new Error("API quota exceeded.");
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) throw new Error("AI failed to generate a new plan.");

            // Try to parse the JSON safely
            let newDailyTasks;
            try {
                // Remove any markdown code block wrappers
                content = content.replace(/```json[\s\S]*?```/g, m => m.replace(/```json|```/g, '').trim());
                content = content.replace(/```[\s\S]*?```/g, m => m.replace(/```/g, '').trim());
                content = content.trim();
                newDailyTasks = JSON.parse(content);
            } catch (err) {
                toast.error("AI response could not be parsed. Try again or adjust your instructions.");
                setLoading(false);
                return;
            }

            // Show confirmation dialog before updating database
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

    // Make sure these handler functions are defined BEFORE the return statement
    const handleMarkBreakDay = (day: number) => {
        if (!roadmap || breakDays.includes(day)) return;
        // ...existing logic for marking break day...
        const idx = roadmap.dailyTasks.findIndex((task: any) => task.day === day);
        if (idx === -1) return;
        if (!roadmap.dailyTasks[idx].task || roadmap.dailyTasks[idx].task === "Break Day") return;
        const updatedTasks = roadmap.dailyTasks.map((task: any) => ({ ...task }));
        updatedTasks.splice(idx, 0, { day, task: "Break Day", difficulty: "Easy", completed: false, isBreak: true });
        if (updatedTasks[idx + 1] && !updatedTasks[idx + 1].isBreak) {
            updatedTasks[idx + 1].day = updatedTasks[idx + 1].day + 1;
        }
        const renumberedTasks = updatedTasks
            .map((task: any, i: number) => ({ ...task, day: i + 1 }))
            .filter((task: any) => task.task && (task.task !== "" || task.isBreak));
        setBreakDays([...breakDays, day]);
        handleRoadmapUpdate({ ...roadmap, dailyTasks: renumberedTasks, days: renumberedTasks.length });
        toast.success(`Break day added for Day ${day}. Next day's task shifted.`);
    };

    const handleRemoveBreakDay = (day: number) => {
        if (!roadmap || !breakDays.includes(day)) return;
        const idx = roadmap.dailyTasks.findIndex((task: any) => task.day === day && (task.isBreak || task.task === "Break Day"));
        if (idx === -1) return;
        let updatedTasks = roadmap.dailyTasks.filter((task: any, i: number) => i !== idx);
        if (updatedTasks[idx] && updatedTasks[idx].day > 1 && !updatedTasks[idx].isBreak) {
            updatedTasks[idx].day = updatedTasks[idx].day - 1;
        }
        const renumberedTasks = updatedTasks
            .map((task: any, i: number) => ({ ...task, day: i + 1 }))
            .filter((task: any) => task.task && (task.task !== "" || task.isBreak));
        setBreakDays(breakDays.filter(d => d !== day));
        handleRoadmapUpdate({ ...roadmap, dailyTasks: renumberedTasks, days: renumberedTasks.length });
        toast.info(`Break day removed for Day ${day}. Next day's task shifted back.`);
    };

    const handleDeleteDay = (day: number) => {
        if (!roadmap) return;
        let updatedTasks = roadmap.dailyTasks.filter((task: any) => task.day !== day);
        updatedTasks = updatedTasks.map((task: any, idx: number) => ({ ...task, day: idx + 1 }));
        handleRoadmapUpdate({ ...roadmap, dailyTasks: updatedTasks, days: updatedTasks.length });
        toast.info(`Day ${day} deleted and days shifted.`);
    };

    const handleEditTask = (day: number, newTask: string) => {
        if (!roadmap) return;
        const updatedTasks = roadmap.dailyTasks.map((task: any) =>
            task.day === day
                ? {
                    ...task,
                    subTasks: (task.subTasks || []).map((sub: any, idx: number) =>
                        idx === 0 ? { ...sub, text: newTask } : sub
                    ),
                    task: newTask
                }
                : task
        );
        handleRoadmapUpdate({ ...roadmap, dailyTasks: updatedTasks });
        toast.success(`Task for Day ${day} updated.`);
    };

    const handleDeleteTask = (day: number, subTaskIndex: number) => {
        if (!roadmap) return;
        const updatedTasks = roadmap.dailyTasks.map((task: any) => {
            if (task.day === day) {
                let subTasks = task.subTasks || task.task.split(';').map((t: string) => ({
                    text: t.trim(),
                    completed: false,
                    studyLogs: []
                }));
                subTasks = subTasks.filter((_, idx) => idx !== subTaskIndex);
                return {
                    ...task,
                    subTasks,
                    task: subTasks.map((t: any) => t.text).join('; ')
                };
            }
            return task;
        });
        handleRoadmapUpdate({ ...roadmap, dailyTasks: updatedTasks });
        toast.info(`Subtask deleted for Day ${day}.`);
    };

    const handleAddSubTask = (day: number, newSubTaskText: string) => {
        if (!roadmap) return;
        const updatedTasks = roadmap.dailyTasks.map((task: any) => {
            if (task.day === day) {
                let subTasks = task.subTasks || task.task.split(';').map((t: string) => ({
                    text: t.trim(),
                    completed: false,
                    studyLogs: []
                }));
                subTasks = [...subTasks, { text: newSubTaskText, completed: false, studyLogs: [] }];
                return {
                    ...task,
                    subTasks,
                    task: subTasks.map((t: any) => t.text).join('; ')
                };
            }
            return task;
        });
        handleRoadmapUpdate({ ...roadmap, dailyTasks: updatedTasks });
        toast.success(`New subtask added for Day ${day}.`);
    };

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
                                    {isNewUser && <p className="text-muted-foreground">Follow the guide to create one.</p>}
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
                            onSetStartDate={handleSetRoadmapStartDate}
                            onRelocateTask={handleRelocateSubTask}
                            onMarkBreakDay={handleMarkBreakDay}
                            onRemoveBreakDay={handleRemoveBreakDay}
                            breakDays={breakDays}
                            onDeleteDay={handleDeleteDay}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onAddSubTask={handleAddSubTask}
                        />
                        <DashboardStats stats={stats} unlockedAchievements={stats?.unlockedAchievements || []} />
                        <MoodTracker onMoodLog={() => handleStatEvent('mood_logged')} />
                    </div>
                </div>
                <div className="mt-8">
                    <FeelingTracker />
                </div>

                <div className="mt-8 lg:mt-12">
                    <Roadmap roadmap={roadmap} selectedDay={selectedDay} onSelectDay={setSelectedDay} currentDay={currentDay} onShift={handleShiftRoadmap}/>
                </div>
                
                <Guiding 
                    isOpen={isGuidingOpen} 
                    onOpenChange={setIsGuidingOpen} 
                    isOtherAssistantOpen={isNyxAssistantOpen}
                    journal={journalEntries}
                    moods={moodAndFeelingData}
                    stats={stats}
                    missions={tasks}
                    roadmap={roadmap}
                />
                <AIAssistant
                    isOpen={isNyxAssistantOpen}
                    onOpenChange={setIsNyxAssistantOpen}
                    isOtherAssistantOpen={isGuidingOpen}
                    missions={tasks}
                    currentRoadmap={roadmap}
                    hasIncompleteTasks={hasIncompleteTasks}
                    allTasksCompleted={allTasksCompleted}
                    currentDay={currentDay}
                    stats={stats}
                    onInfuseTasks={handleInfuseTasks}
                    onReplan={handleReplanClick}
                />
            </main>

            <Footer />
            <StickyNotes />
            <AIBubble
                isNyxOpen={isNyxAssistantOpen}
                setNyxOpen={setIsNyxAssistantOpen}
                isSallyOpen={isGuidingOpen}
                setSallyOpen={setIsGuidingOpen}
            />
            {/* FIX: Render StudyTimer when activeTimerDetails is set */}
            {activeTimerDetails && (
                <StudyTimer
                    taskText={activeTimerDetails.taskText}
                    elapsedSeconds={sessionSeconds}
                    totalLoggedTime={activeTimerDetails.logs.reduce((acc, log) => acc + log.duration, 0)}
                    isActive={timerIsActive}
                    setIsActive={setTimerIsActive}
                    studyLogs={activeTimerDetails.logs}
                    onSaveSession={handleSaveSession}
                    onEditLog={handleEditStudyLog}
                    onDeleteLog={handleDeleteStudyLog}
                    onClose={handleCloseTimer}
                />
            )}

            {/* Show dialog for custom prompt when replan is triggered */}
            {showReplanDialog && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
                    <div className="bg-card rounded-lg p-6 shadow-xl max-w-lg w-full">
                        <h2 className="text-xl font-bold mb-2">Customize AI Roadmap Replan</h2>
                        <p className="mb-2 text-muted-foreground">Add instructions, preferences, or ideas for the AI to use when re-planning your roadmap.</p>
                        <textarea
                            className="w-full p-2 rounded border border-primary/30 bg-background/80 mb-4"
                            value={customReplanPrompt}
                            onChange={e => setCustomReplanPrompt(e.target.value)}
                            placeholder="E.g. Focus on weekends, add more review days, etc."
                            rows={4}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowReplanDialog(false)}>Cancel</Button>
                            <Button onClick={handleReplanWithAI}>Replan with AI</Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Show RoadmapPreview for confirmation before updating database */}
            {proposedRoadmap && (
                <RoadmapPreview
                    proposedRoadmap={proposedRoadmap}
                    onCancel={handleCancelChanges}
                    onApprove={handleApproveChanges}
                    currentDay={currentDay}
                />
            )}
        </div>
    );
};

export default Index;