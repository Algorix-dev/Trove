'use client';

import { Lock, Unlock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

const BADGES: BadgeItem[] = [
  {
    id: 'novice',
    name: 'Novice Reader',
    description: 'Read your first book',
    icon: '📚',
    unlocked: true,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Reach a 7-day reading streak',
    icon: '🔥',
    unlocked: false,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Read 10 books',
    icon: '🎓',
    unlocked: false,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    id: 'social',
    name: 'Social Butterfly',
    description: 'Join 3 communities',
    icon: '🦋',
    unlocked: false,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  },
  {
    id: 'critic',
    name: 'The Critic',
    description: 'Leave 5 notes',
    icon: '✍️',
    unlocked: false,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  {
    id: 'master',
    name: 'Master Reader',
    description: 'Read 50 books',
    icon: '👑',
    unlocked: false,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
];

export function BadgesList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                badge.unlocked
                  ? 'bg-card border-border shadow-sm'
                  : 'bg-muted/50 border-transparent opacity-70 grayscale'
              }`}
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${badge.unlocked ? badge.color : 'bg-muted'}`}
              >
                {badge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  {badge.unlocked ? (
                    <Unlock className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
