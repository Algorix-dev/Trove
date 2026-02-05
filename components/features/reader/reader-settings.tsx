'use client';

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReaderSettingsProps {
  onThemeChange: (theme: 'light' | 'dark' | 'sepia') => void;
  currentTheme: 'light' | 'dark' | 'sepia';
}

export function ReaderSettings({ onThemeChange, currentTheme }: ReaderSettingsProps) {
  return (
    <Card className="w-72 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Reader Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">Theme</label>
          <div className="flex gap-2">
            <Button
              variant={currentTheme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => onThemeChange('light')}
            >
              <Sun className="h-4 w-4 mr-2" /> Light
            </Button>
            <Button
              variant={currentTheme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 bg-[#1a1c1e] text-white hover:bg-[#2a2c2e]"
              onClick={() => onThemeChange('dark')}
            >
              <Moon className="h-4 w-4 mr-2" /> Dark
            </Button>
            <Button
              variant={currentTheme === 'sepia' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 bg-[#f4ecd8] text-[#5b4636] hover:bg-[#e4dcba]"
              onClick={() => onThemeChange('sepia')}
            >
              <div className="w-4 h-4 rounded-full bg-[#f4ecd8] border border-[#5b4636] mr-2" /> Sepia
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Font Size</label>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {/* handle font size */ }}>
              A-
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {/* handle font size */ }}>
              A+
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
