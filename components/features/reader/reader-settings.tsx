'use client';

import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReaderSettingsProps {
  onThemeChange: (theme: 'light' | 'dark' | 'sepia' | 'night' | 'custom') => void;
  currentTheme: 'light' | 'dark' | 'sepia' | 'night' | 'custom';
}

export function ReaderSettings({
  onThemeChange,
  currentTheme,
}: ReaderSettingsProps) {
  return (
    <Card className="w-72 shadow-xl border border-[var(--reader-border)] bg-[var(--reader-bg-secondary)]/90 backdrop-blur-xl text-[var(--reader-text)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">
          Reader Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Theme</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentTheme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="h-10 rounded-xl justify-start px-3"
              onClick={() => onThemeChange('light')}
            >
              <div className="w-4 h-4 rounded-full bg-white border border-gray-200 mr-2" />
              <span className="text-xs">Light</span>
            </Button>
            <Button
              variant={currentTheme === 'sepia' ? 'default' : 'outline'}
              size="sm"
              className="h-10 rounded-xl justify-start px-3"
              onClick={() => onThemeChange('sepia')}
            >
              <div className="w-4 h-4 rounded-full bg-[#f4ecd8] border border-[#5b4636] mr-2" />
              <span className="text-xs">Sepia</span>
            </Button>
            <Button
              variant={currentTheme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="h-10 rounded-xl justify-start px-3"
              onClick={() => onThemeChange('dark')}
            >
              <div className="w-4 h-4 rounded-full bg-[#1a1c1e] border border-gray-700 mr-2" />
              <span className="text-xs">Dark</span>
            </Button>
            <Button
              variant={currentTheme === 'night' ? 'default' : 'outline'}
              size="sm"
              className="h-10 rounded-xl justify-start px-3"
              onClick={() => onThemeChange('night')}
            >
              <div className="w-4 h-4 rounded-full bg-black border border-gray-800 mr-2" />
              <span className="text-xs">Night</span>
            </Button>
            <Button
              variant={currentTheme === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="h-10 rounded-xl justify-start px-3 col-span-2"
              onClick={() => onThemeChange('custom')}
            >
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              <span className="text-xs">Custom Colors</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
