'use client';

import { BookOpen, Library, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { UploadModal } from './upload-modal';

export function EmptyLibrary() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Library className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Your library is empty</h3>
        <p className="text-muted-foreground mb-8 max-w-md">
          Start building your personal reading collection by uploading your first book. Supported
          formats: PDF, EPUB, and TXT.
        </p>
        <div className="flex gap-3">
          <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Features
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl">
          <div className="text-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold mb-1">Track Progress</h4>
            <p className="text-sm text-muted-foreground">
              Automatically save your reading position
            </p>
          </div>
          <div className="text-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold mb-1">Take Notes</h4>
            <p className="text-sm text-muted-foreground">Highlight and annotate as you read</p>
          </div>
          <div className="text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Library className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-semibold mb-1">Build Streaks</h4>
            <p className="text-sm text-muted-foreground">Earn achievements and level up</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
