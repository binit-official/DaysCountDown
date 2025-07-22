import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
// FIX: Added 'documentId' to the import statement
import { collection, onSnapshot, query, where, Timestamp, doc, documentId } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { subDays, startOfDay, isToday, isWithinInterval, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Added a comprehensive color map for moods
const MOOD_COLORS: { [key: string]: string } = {
  'Productive': '#22c55e', 'Focused': '#3b82f6', 'Happy': '#eab308',
  'Confident': '#f97316', 'Okay': '#a1a1aa', 'Blank': '#71717a',
  'Sad': '#6366f1', 'Stressed': '#f97316', 'Angry': '#ef4444',
  'Overthinking': '#8b5cf6', 'Tired': '#71717a', 'Unmotivated': '#ec4899',
  'Confused': '#f59e0b', 'Anxious': '#14b8a6', 'Calm': '#84cc16',
  'Energetic': '#facc15', 'Peaceful': '#818cf8', 'Caffeinated': '#a16207',
};

const ProgressDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState<{ daily: any[], weekly: any[], monthly: any[] }>({ daily: [], weekly: [], monthly: [] });
  const [moodData, setMoodData] = useState<{ daily: any[], weekly: any[], monthly: any[] }>({ daily: [], weekly: [], monthly: [] });

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const weeklyStartDate = startOfDay(subDays(now, 7));
    const monthlyStartDate = startOfDay(subDays(now, 30));

    // Journal/Mood Data Fetching
    const journalCollectionRef = collection(db, 'users', user.uid, 'journal');
    const journalQuery = query(journalCollectionRef, where(documentId(), '>=', format(monthlyStartDate, 'yyyy-MM-dd')));
    
    const unsubscribeMood = onSnapshot(journalQuery, (querySnapshot) => {
        const dailyCounts: { [key: string]: number } = {};
        const weeklyCounts: { [key: string]: number } = {};
        const monthlyCounts: { [key: string]: number } = {};

        querySnapshot.forEach(doc => {
            const dayData = doc.data();
            if (dayData.moods && Array.isArray(dayData.moods)) {
                dayData.moods.forEach((moodEntry: any) => {
                    const mood = moodEntry.mood;
                    const timestamp = moodEntry.timestamp.toDate();

                    monthlyCounts[mood] = (monthlyCounts[mood] || 0) + 1;
                    
                    if (isWithinInterval(timestamp, { start: weeklyStartDate, end: now })) {
                        weeklyCounts[mood] = (weeklyCounts[mood] || 0) + 1;
                    }
                    if (isToday(timestamp)) {
                        dailyCounts[mood] = (dailyCounts[mood] || 0) + 1;
                    }
                });
            }
        });

        setMoodData({
            daily: Object.keys(dailyCounts).map(mood => ({ name: mood, count: dailyCounts[mood] })),
            weekly: Object.keys(weeklyCounts).map(mood => ({ name: mood, count: weeklyCounts[mood] })),
            monthly: Object.keys(monthlyCounts).map(mood => ({ name: mood, count: monthlyCounts[mood] })),
        });
    });

    // Roadmap Data Fetching
    const roadmapDocRef = doc(db, 'users', user.uid, 'data', 'roadmap');
    const unsubscribeRoadmap = onSnapshot(roadmapDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const dailyTasks = data.dailyTasks || [];
        const roadmapStartDate = data.startDate.toDate();

        const dailyFiltered = dailyTasks.filter((task: any) => isToday(startOfDay(new Date(roadmapStartDate.getTime() + (task.day - 1) * 86400000))));
        const weeklyFiltered = dailyTasks.filter((task: any) => startOfDay(new Date(roadmapStartDate.getTime() + (task.day - 1) * 86400000)) >= weeklyStartDate);
        const monthlyFiltered = dailyTasks.filter((task: any) => startOfDay(new Date(roadmapStartDate.getTime() + (task.day - 1) * 86400000)) >= monthlyStartDate);

        setTaskData({
          daily: [
            { name: 'Completed', value: dailyFiltered.filter((t: any) => t.completed).length },
            { name: 'Pending', value: dailyFiltered.filter((t: any) => !t.completed).length },
          ],
          weekly: [
            { name: 'Completed', value: weeklyFiltered.filter((t: any) => t.completed).length },
            { name: 'Pending', value: weeklyFiltered.filter((t: any) => !t.completed).length },
          ],
          monthly: [
            { name: 'Completed', value: monthlyFiltered.filter((t: any) => t.completed).length },
            { name: 'Pending', value: monthlyFiltered.filter((t: any) => !t.completed).length },
          ],
        });
      }
    });

    return () => {
      unsubscribeMood();
      unsubscribeRoadmap();
    };
  }, [user]);

  const PIE_COLORS = ['#10B981', '#EF4444'];

  const renderStatsCard = (timeframe: string, taskRangeData: any[], moodRangeData: any[]) => (
    <div className="space-y-8">
      <Card className="neon-border bg-card/90">
        <CardHeader>
          <CardTitle className="text-center">{timeframe} Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskRangeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {taskRangeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="neon-border bg-card/90">
        <CardHeader>
          <CardTitle className="text-center">{timeframe} Emotional Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moodRangeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="count">
                {moodRangeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#a1a1aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto">
        <Button onClick={() => navigate(-1)} className="mb-8 cyberpunk-button">Back to Dashboard</Button>
        <h1 className="text-4xl font-bold mb-8 text-center neon-text">Progress Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {renderStatsCard("Daily", taskData.daily, moodData.daily)}
          {renderStatsCard("Weekly", taskData.weekly, moodData.weekly)}
          {renderStatsCard("Monthly", taskData.monthly, moodData.monthly)}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;