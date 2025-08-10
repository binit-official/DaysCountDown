import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Achievements } from '@/components/Achievements';

interface DashboardStatsProps {
  stats: {
    streak: number;
    maxStreak: number;
    completedMissions: number;
  };
  unlockedAchievements: string[];
}

export const DashboardStats = ({ stats, unlockedAchievements }: DashboardStatsProps) => {
  return (
    <div className="space-y-6">
      <Card className="neon-border bg-card/90">
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-3xl font-bold">{stats.streak} Days</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Max Streak</p>
            <p className="text-3xl font-bold">{stats.maxStreak} Days</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Missions Completed</p>
            <p className="text-3xl font-bold">{stats.completedMissions}</p>
          </div>
        </CardContent>
      </Card>
      <Achievements unlockedAchievements={unlockedAchievements} />
    </div>
  );
};