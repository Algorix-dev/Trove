"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"

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
            <CardContent className="space-y-4">\n                <div className="space-y-2">\n                    <label className="text-xs font-medium">Theme</label>
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
                        className="flex-1"
                        onClick={() => onThemeChange('dark')}
                    >
                        <Moon className="h-4 w-4 mr-2" /> Dark
                    </Button>
                    <Button
                        variant={currentTheme === 'sepia' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => onThemeChange('sepia')}
                    >
                        <Monitor className="h-4 w-4" /> Sepia
                    </Button>
                </div>
            </div>
            </CardContent>
        </Card>
    )
}
