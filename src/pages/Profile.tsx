import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { getAuth, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Achievements } from '@/components/Achievements';
import { Task } from '@/components/TaskManager';
import { format } from 'date-fns';

const formatStudyTime = (totalSeconds: number) => {
    if(!totalSeconds) return "0h 0m";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ streak: 0, completedMissions: 0, totalStudyTime: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user) return;
    const statsDocRef = doc(db, 'users', user.uid, 'data', 'stats');
    const unsubscribe = onSnapshot(statsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({ 
            streak: data.streak || 0, 
            completedMissions: data.completedMissions || 0,
            totalStudyTime: data.totalStudyTime || 0
        });
        setUnlockedAchievements(data.unlockedAchievements || []);
        setArchivedTasks(data.archivedTasks?.map((t: any) => ({...t, targetDate: t.targetDate.toDate()})) || []);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await updateProfile(user, { displayName });
      toast.success('Name updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update name:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <Button onClick={() => navigate(-1)} className="mb-8 cyberpunk-button">Back to Dashboard</Button>
        <div className="space-y-8">
          
          <Card className="neon-border bg-card/90">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{stats.streak} Days</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Missions Completed</p>
                <p className="text-3xl font-bold">{stats.completedMissions}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Study Time</p>
                <p className="text-3xl font-bold">{formatStudyTime(stats.totalStudyTime)}</p>
              </div>
            </CardContent>
          </Card>

          <Achievements unlockedAchievements={unlockedAchievements} />

          <Card className="neon-border bg-card/90">
            <CardHeader>
              <CardTitle>Archived Missions</CardTitle>
              <CardDescription>A record of your past victories.</CardDescription>
            </CardHeader>
            <CardContent>
              {archivedTasks.length > 0 ? (
                <ul className="space-y-3">
                  {archivedTasks.map(task => (
                    <li key={task.id} className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Completed on: {format(task.targetDate, 'MMMM d, yyyy')}</p>
                      </div>
                      <span className="text-xs font-bold text-green-400">COMPLETE</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">No missions archived yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="neon-border bg-card/90">
            <CardHeader>
              <CardTitle>Update Profile</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Name'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;