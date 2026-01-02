'use client';

import { Star, Trophy } from 'lucide-react';

import { Progress } from '@/components/ui/progress';

interface LevelProgressProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  levelTitle: string;
}

export function LevelProgress({ level, currentXP, nextLevelXP, levelTitle }: LevelProgressProps) {
  // Calculate progress percentage
  // Assuming levels start at 0 XP for level 1 (simplified)
  // Real logic might need prev level threshold to calculate bar fill correctly if levels have gaps
  // For now simple percentage of current level requirement

  // Simple logic: XP towards next level
  // If Level 1 is 0-500, and user has 250, progress is 50%
  // If Level 2 is 500-1500 (1000 diff), and user has 1000 total (500 into lvl 2), progress is 50%

  // We need minXP for current level to do this accurately. Passed in or derived?
  // Let's rely on props for now, parent can calculate range.

  const progress = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Trophy className="h-24 w-24" />
      </div>

      <div className="flex justify-between items-center mb-2 relative z-10">
        <div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Current Level
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{level}</span>
            <span className="text-sm font-medium text-foreground/80">{levelTitle}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Total XP
          </div>
          <div className="text-xl font-bold flex items-center gap-1 justify-end">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            {currentXP.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <Progress value={progress} className="h-3 bg-muted" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentXP} XP</span>
          <span>{nextLevelXP} XP</span>
        </div>
      </div>
    </div>
  );
}
