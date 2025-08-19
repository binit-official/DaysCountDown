import React, { useState } from "react";
import { ALL_ACHIEVEMENTS } from '@/components/Achievements';
import { ScrollArea } from '@/components/ui/scroll-area';

// Unique icons for achievements (example mapping)
const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  "early_bird": <span role="img" aria-label="Early Bird">🌅</span>,
  "night_owl": <span role="img" aria-label="Night Owl">🦉</span>,
  "perfect_week": <span role="img" aria-label="Perfect Week">🏆</span>,
  "roadmap_30_days": <span role="img" aria-label="30 Days">📅</span>,
  "study_1_hour": <span role="img" aria-label="1 Hour">⏰</span>,
  "study_10_hours": <span role="img" aria-label="10 Hours">🕙</span>,
  "study_50_hours": <span role="img" aria-label="50 Hours">⏳</span>,
  "study_marathon": <span role="img" aria-label="Marathon">🏃‍♂️</span>,
  "mission_1": <span role="img" aria-label="Mission 1">🚀</span>,
  "mission_5": <span role="img" aria-label="Mission 5">🎯</span>,
  "mission_10": <span role="img" aria-label="Mission 10">🥇</span>,
  "mission_25": <span role="img" aria-label="Mission 25">🥈</span>,
  "extreme_1": <span role="img" aria-label="Extreme">🔥</span>,
  "journal_1": <span role="img" aria-label="Journal">📓</span>,
  "journal_7_days": <span role="img" aria-label="Journal 7">🗓️</span>,
  "mood_10_logs": <span role="img" aria-label="Mood">😊</span>,
  "feedback_1": <span role="img" aria-label="Feedback">💬</span>,
  "streak_3": <span role="img" aria-label="Streak">⚡</span>,
};

interface DashboardStatsProps {
  stats: {
    streak: number;
    maxStreak: number;
    completedMissions: number;
  };
  unlockedAchievements: string[];
}

export const DashboardStats = ({ stats, unlockedAchievements }: { stats: any, unlockedAchievements: string[] }) => {
  const streak = stats?.streak ?? 0;
  const maxStreak = stats?.maxStreak ?? 0;
  const completedMissions = stats?.completedMissions ?? 0;
  const totalStudyTime = stats?.totalStudyTime ?? 0;

  const getAchievement = (id: string) =>
    ALL_ACHIEVEMENTS.find(a => a.id === id);

  const renderAchievementIcon = (id: string, fallback: any) => {
    if (ACHIEVEMENT_ICONS[id]) return ACHIEVEMENT_ICONS[id];
    if (fallback) {
      if (React.isValidElement(fallback)) return fallback;
      if (typeof fallback === "function") return React.createElement(fallback);
      if (typeof fallback === "string") return fallback;
    }
    return "🏆";
  };

  const [shareAchId, setShareAchId] = useState<string | null>(null);

  const ShareCard = ({ achievement }: { achievement: any }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center border-4 border-accent">
        <div className="text-7xl mb-4">{renderAchievementIcon(achievement?.id, achievement?.icon)}</div>
        <div className="text-3xl font-extrabold text-accent mb-2 text-center">{achievement?.name}</div>
        <div className="text-lg text-muted-foreground mb-4 text-center">{achievement?.description}</div>
        <div className="flex gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-accent text-white font-bold shadow hover:bg-accent/80"
            onClick={() => {
              navigator.clipboard.writeText(
                `🏆 Achievement Unlocked: ${achievement?.name}\n${achievement?.description ?? ""}`
              );
            }}
          >
            Copy
          </button>
          <button
            className="px-4 py-2 rounded bg-muted text-muted-foreground font-bold shadow hover:bg-muted/80"
            onClick={() => setShareAchId(null)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 neon-border bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl shadow-lg backdrop-blur-md w-full max-w-md mx-auto">
      <h2 className="text-xl md:text-2xl font-extrabold mb-3 gradient-text text-center tracking-tight">Dashboard Stats</h2>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-card/80 rounded-lg p-2 flex flex-col items-center shadow border border-primary/20">
          <span className="text-sm font-semibold text-muted-foreground mb-1">Streak</span>
          <span className="text-2xl font-black text-primary drop-shadow">{streak}</span>
        </div>
        <div className="bg-card/80 rounded-lg p-2 flex flex-col items-center shadow border border-accent/20">
          <span className="text-sm font-semibold text-muted-foreground mb-1">Max Streak</span>
          <span className="text-2xl font-black text-accent drop-shadow">{maxStreak}</span>
        </div>
        <div className="bg-card/80 rounded-lg p-2 flex flex-col items-center shadow border border-green-500/20">
          <span className="text-sm font-semibold text-muted-foreground mb-1">Completed</span>
          <span className="text-2xl font-black text-green-600 drop-shadow">{completedMissions}</span>
        </div>
        <div className="bg-card/80 rounded-lg p-2 flex flex-col items-center shadow border border-blue-500/20">
          <span className="text-sm font-semibold text-muted-foreground mb-1">Study Time</span>
          <span className="text-2xl font-black text-blue-600 drop-shadow">{Math.floor(totalStudyTime / 60)} min</span>
        </div>
      </div>
      <div className="mt-2">
        <h3 className="text-base font-bold mb-2 text-muted-foreground text-center">Unlocked Achievements</h3>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-accent/40 scrollbar-track-transparent">
          <div className="flex gap-3 px-1 py-2 min-h-[64px]">
            {unlockedAchievements && unlockedAchievements.length > 0 ? (
              unlockedAchievements.map((ach) => {
                const achievement = getAchievement(ach);
                return (
                  <button
                    key={ach}
                    className="flex flex-col items-center px-3 py-2 rounded-lg bg-gradient-to-br from-accent/80 to-primary/30 shadow border border-accent/30 min-w-[100px] max-w-[140px] cursor-pointer hover:ring-2 hover:ring-accent transition"
                    onClick={() => setShareAchId(ach)}
                    title="Share this achievement"
                  >
                    <span className="mb-1 text-3xl drop-shadow">
                      {renderAchievementIcon(ach, achievement?.icon)}
                    </span>
                    <span className="text-sm md:text-base font-bold text-accent-foreground text-center">{achievement?.name ?? ach}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-muted-foreground">None yet</span>
            )}
          </div>
        </div>
      </div>
      {shareAchId && (
        <ShareCard achievement={getAchievement(shareAchId)} />
      )}
    </div>
  );
};