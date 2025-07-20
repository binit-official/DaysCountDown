import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, Timestamp, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { subDays, startOfDay, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ProgressDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState<{ daily: any[], weekly: any[], monthly: any[] }>({ daily: [], weekly: [], monthly: [] });
  const [moodData, setMoodData] = useState<{ daily: any[], weekly: any[], monthly: any[] }>({ daily: [], weekly: [], monthly: [] });

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const dailyStartDate = subDays(now, 1);
    const weeklyStartDate = subDays(now, 7);
    const monthlyStartDate = subDays(now, 30);

    // Mood Data Fetching
    const moodCollectionRef = collection(db, 'users', user.uid, 'moodEntries');
    const moodQuery = query(moodCollectionRef, where('timestamp', '>=', Timestamp.fromDate(monthlyStartDate)));
    const unsubscribeMood = onSnapshot(moodQuery, (querySnapshot) => {
      const dailyCounts: { [key: string]: number } = {};
      const weeklyCounts: { [key: string]: number } = {};
      const monthlyCounts: { [key: string]: number } = {};
      
      querySnapshot.forEach(doc => {
        const mood = doc.data().mood;
        const timestamp = doc.data().timestamp.toDate();

        monthlyCounts[mood] = (monthlyCounts[mood] || 0) + 1;
        if (timestamp >= weeklyStartDate) {
          weeklyCounts[mood] = (weeklyCounts[mood] || 0) + 1;
        }
        if (timestamp >= dailyStartDate) {
          dailyCounts[mood] = (dailyCounts[mood] || 0) + 1;
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
        const weeklyFiltered = dailyTasks.filter((task: any) => startOfDay(new Date(roadmapStartDate.getTime() + (task.day - 1) * 86400000)) >= startOfDay(weeklyStartDate));
        const monthlyFiltered = dailyTasks.filter((task: any) => startOfDay(new Date(roadmapStartDate.getTime() + (task.day - 1) * 86400000)) >= startOfDay(monthlyStartDate));

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

  const COLORS = ['#10B981', '#EF4444'];

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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <BarChart data={moodRangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
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
        <h1 className="text-4xl font-bold mb-8 text-center">Progress Dashboard</h1>
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