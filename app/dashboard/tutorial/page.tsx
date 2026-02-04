'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: 'Welcome to Trove',
    description: 'Your personal reading companion',
    icon: BookOpen,
    content:
      "Trove helps you organize your books, track your reading progress, and discover new favorites. Let's explore the key features!",
    highlight: null,
  },
  {
    id: 2,
    title: 'Your Library',
    description: 'All your books in one place',
    icon: BookOpen,
    content:
      'Upload and organize your books. Track reading progress, add notes, and bookmark your favorite passages.',
    highlight: 'library',
  },
  {
    id: 3,
    title: 'Analytics & Stats',
    description: 'Track your reading journey',
    icon: BarChart3,
    content:
      'View detailed statistics about your reading habits, track your progress, and see your reading trends over time.',
    highlight: 'dashboard',
  },
  {
    id: 4,
    title: 'Gamification',
    description: 'Level up as you read',
    icon: Trophy,
    content:
      'Earn XP for every minute you read, unlock achievements, maintain reading streaks, and climb the leaderboard!',
    highlight: 'dashboard',
  },
  {
    id: 5,
    title: 'Community',
    description: 'Connect with other readers',
    icon: Users,
    content:
      'Join discussions, share recommendations, and connect with fellow book lovers in our community spaces.',
    highlight: 'community',
  },
  {
    id: 6,
    title: 'Marketplace',
    description: 'Buy and sell books',
    icon: ShoppingBag,
    content:
      'Browse listings, sell your books, or find rare editions. All transactions are secure and tracked.',
    highlight: 'marketplace',
  },
  {
    id: 7,
    title: 'AI Assistant',
    description: 'Your reading companion',
    icon: Sparkles,
    content:
      'Get personalized book recommendations, study tips, reading analytics, and AI-powered book summaries.',
    highlight: 'dashboard',
  },
  {
    id: 8,
    title: "You're Ready!",
    description: 'Start your reading journey',
    icon: Sparkles,
    content:
      "You're all set! Explore Trove and discover the joy of organized reading. Happy reading!",
    highlight: null,
  },
];

export default function TutorialPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Allow skipping after 3 seconds
    const timer = setTimeout(() => setCanSkip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ tutorial_completed: true })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Tutorial completed! Welcome to Trove! 🎉');
      router.refresh();
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete tutorial');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

      {/* Background content (blurred) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-9xl text-muted-foreground/20">
            <Icon className="w-64 h-64" />
          </div>
        </div>
      </div>

      {/* Tutorial overlay */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="w-full max-w-2xl"
        >
          <Card className="border-2 shadow-2xl bg-background/95 backdrop-blur">
            <CardHeader className="text-center space-y-4 pb-6">
              {/* Skip button */}
              {canSkip && (
                <div className="absolute top-4 right-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Skip Tutorial
                  </Button>
                </div>
              )}

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Icon className="w-10 h-10 text-primary" />
              </motion.div>

              <div>
                <CardTitle className="text-3xl mb-2">{step.title}</CardTitle>
                <CardDescription className="text-base">{step.description}</CardDescription>
              </div>

              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-lg text-muted-foreground max-w-md mx-auto"
              >
                {step.content}
              </motion.p>

              {step.highlight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-muted/50 rounded-lg p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    💡 You can explore the <strong>{step.highlight}</strong> section after this
                    tutorial
                  </p>
                </motion.div>
              )}

              <div className="flex justify-between pt-6">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                <Button onClick={handleNext} disabled={loading} className="min-w-[120px]">
                  {currentStep === TUTORIAL_STEPS.length - 1 ? (
                    'Get Started'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
