'use client';

import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BookSummaryProps {
  bookTitle: string;
}

export function BookSummary({ bookTitle }: BookSummaryProps) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSummary = () => {
    setLoading(true);

    // Simulate AI generation with realistic delay
    setTimeout(() => {
      const summaries = [
        `"${bookTitle}" is a compelling narrative that explores themes of human resilience, personal growth, and the power of choice. The story follows characters navigating complex moral dilemmas while discovering profound truths about themselves and the world around them. Through vivid storytelling and rich character development, the author weaves together multiple perspectives to create a thought-provoking examination of what it means to live authentically.`,

        `This book masterfully combines elements of philosophy, psychology, and storytelling to deliver a transformative reading experience. "${bookTitle}" challenges readers to reconsider their assumptions about success, happiness, and purpose. The narrative is structured around key insights that build upon each other, creating a framework for understanding both personal and universal human experiences.`,

        `"${bookTitle}" stands out for its unique approach to exploring timeless questions through contemporary lens. The author's distinctive voice and careful attention to detail create an immersive world that resonates with readers long after the final page. Key themes include the nature of identity, the impact of our choices, and the interconnectedness of human experience.`,
      ];

      setSummary(summaries[Math.floor(Math.random() * summaries.length)]);
      setLoading(false);
    }, 2000);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">AI Book Summary</h3>
          <p className="text-xs text-muted-foreground">Get an intelligent overview</p>
        </div>
      </div>

      {!summary && !loading && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Generate an AI-powered summary of this book
          </p>
          <Button
            onClick={generateSummary}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Summary
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Analyzing book content...</p>
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-lg p-4 border border-purple-500/20">
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateSummary} variant="outline" size="sm">
              <Sparkles className="h-3 w-3 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
