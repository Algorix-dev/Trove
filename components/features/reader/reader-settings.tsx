'use client';

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReaderSettingsProps {
  onThemeChange: (theme: 'light' | 'dark' | 'sepia') => void;
  currentTheme: 'light' | 'dark' | 'sepia';
}

export function ReaderSettings({
  onThemeChange,
  currentTheme,
}: ReaderSettingsProps) {
  return (
    <Card className="w-72 shadow-xl border-none bg-background/80 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">
          Reader Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Theme</label>
          <div className="flex flex-col gap-2">
            <Button
              variant={currentTheme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="w-full h-10 rounded-xl justify-start"
              onClick={() => onThemeChange('light')}
            >
              <Sun className="h-4 w-4 mr-2" /> Light
            </Button>
            <Button
              variant={currentTheme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="w-full h-10 rounded-xl justify-start bg-[#1a1c1e] text-white hover:bg-[#2a2c2e]"
              onClick={() => onThemeChange('dark')}
            >
              <Moon className="h-4 w-4 mr-2" /> Dark
            </Button>
            <Button
              variant={currentTheme === 'sepia' ? 'default' : 'outline'}
              size="sm"
              className="w-full h-10 rounded-xl justify-start bg-[#f4ecd8] text-[#5b4636] hover:bg-[#e4dcba]"
              onClick={() => onThemeChange('sepia')}
            >
              <div className="w-3 h-3 rounded-full bg-[#f4ecd8] border border-[#5b4636] mr-2" /> Sepia
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
