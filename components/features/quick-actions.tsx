'use client';

import { Highlighter, Library, Upload } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/library?upload=true">
            <Upload className="h-4 w-4" /> Upload Book
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/library">
            <Library className="h-4 w-4" /> Open Library
          </Link>
        </Button>
        <Button variant="outline" className="justify-start gap-2" asChild>
          <Link href="/dashboard/notes">
            <Highlighter className="h-4 w-4" /> View Notes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
