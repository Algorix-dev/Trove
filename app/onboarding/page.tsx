'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, ImagePlus, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Biography',
  'History',
  'Self-Help',
  'Business',
  'Philosophy',
  'Poetry',
  'Horror',
  'Thriller',
  'Young Adult',
  'Manga',
  'Comics',
  'Anime',
  'Educational',
  'Technical',
];

const STEPS = [
  { id: 1, title: 'Welcome', description: "Let's personalize your Trove experience" },
  { id: 2, title: 'Your Name', description: 'What should we call you?' },
  { id: 3, title: 'Choose Your Look', description: 'Upload a photo or pick a character' },
  { id: 4, title: 'Your Interests', description: 'What genres do you love?' },
  { id: 5, title: 'Favorite Books', description: "Tell us about books you've enjoyed" },
  { id: 6, title: 'All Set!', description: 'Ready to start your reading journey' },
];

const PRESET_AVATARS = [
  { id: 'scholar', name: 'The Scholar', color: 'bg-blue-500' },
  { id: 'wizard', name: 'The Wizard', color: 'bg-purple-500' },
  { id: 'explorer', name: 'The Explorer', color: 'bg-green-500' },
  { id: 'mentor', name: 'The Mentor', color: 'bg-amber-500' },
  { id: 'observer', name: 'The Observer', color: 'bg-slate-500' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarChoice, setAvatarChoice] = useState<string>('default');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<string[]>([]);
  const [bookInput, setBookInput] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      router.push('/dashboard');
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const addFavoriteBook = () => {
    if (bookInput.trim() && !favoriteBooks.includes(bookInput.trim())) {
      setFavoriteBooks([...favoriteBooks, bookInput.trim()]);
      setBookInput('');
    }
  };

  const removeFavoriteBook = (book: string) => {
    setFavoriteBooks(favoriteBooks.filter((b) => b !== book));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setAvatarChoice('upload');
      toast.success('Avatar uploaded!');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nickname,
          onboarding_completed: true,
          avatar_url:
            avatarUrl ||
            (avatarChoice !== 'default' && avatarChoice !== 'upload'
              ? `/avatars/${avatarChoice}.png`
              : null),
          avatar_choice: avatarChoice,
          username: nickname.toLowerCase().replace(/\s+/g, '_') || user.email?.split('@')[0],
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Save preferences
      const { error: prefsError } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        favorite_genres: selectedGenres,
        favorite_books: favoriteBooks,
        updated_at: new Date().toISOString(),
      });

      if (prefsError) throw prefsError;

      toast.success('Welcome to Trove! 🎉');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] bg-card/80 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="text-center space-y-6 pb-6 pt-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center shadow-xl border border-primary/20"
            >
              <BookOpen className="w-10 h-10 text-primary" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic">
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-lg font-medium opacity-70">
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </div>
            <div className="px-8 space-y-2">
              <Progress value={progress} className="h-1.5 bg-muted/40" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
                Phase {currentStep} <span className="mx-2">//</span> {STEPS.length}
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-12 pb-12">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    <Sparkles className="w-20 h-20 text-primary mx-auto mb-6 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black italic tracking-tighter">
                      Your Journey Begins.
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
                      Trove is more than a reader. It's your sanctuary for wisdom and discovery.
                      Let's make it yours.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center pt-6">
                    {['Curated Feed', 'Naira Payments', 'Social Clubs'].map((item) => (
                      <div
                        key={item}
                        className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-full text-xs font-bold text-primary shadow-sm"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="nickname"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <Label
                      htmlFor="nickname"
                      className="text-sm font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Public Handle
                    </Label>
                    <Input
                      id="nickname"
                      placeholder="e.g. ShadowReader or WisdomKeeper"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="h-16 text-2xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/20 px-6"
                      autoFocus
                    />
                    <p className="text-sm text-medium text-muted-foreground italic px-2">
                      This is how other travelers will identify you in the Circle.
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                      <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Personal Photo
                      </Label>
                      <div className="relative group overflow-hidden bg-muted/30 rounded-[2rem] aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border group-hover:border-primary/50 transition-all">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt="Avatar"
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ImagePlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-[10px] font-bold opacity-50">JPG, PNG or GIF</p>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={handleAvatarUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*"
                          disabled={uploadingAvatar}
                        />
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                            Optimizing...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Preset Identity
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {PRESET_AVATARS.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => {
                              setAvatarChoice(avatar.id);
                              setAvatarUrl(null);
                            }}
                            className={`aspect-square rounded-2xl border-4 transition-all overflow-hidden relative group ${
                              avatarChoice === avatar.id
                                ? 'border-primary shadow-xl scale-105'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <Image
                              src={`/avatars/${avatar.id}.png`}
                              alt={avatar.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium italic">
                        Hand-crafted presets to kickstart your journey.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="genres"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">
                    Knowledge Domains
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-2 scrollbar-hide">
                    {GENRES.map((genre) => (
                      <motion.button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                          selectedGenres.includes(genre)
                            ? 'border-primary bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] text-white'
                            : 'border-muted bg-muted/20 hover:border-primary/30'
                        }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {genre}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="books"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">
                    Existing Legends
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Add a book to your favorites..."
                      value={bookInput}
                      onChange={(e) => setBookInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFavoriteBook()}
                      className="h-14 bg-muted/30 border-none rounded-2xl font-medium px-6"
                    />
                    <Button
                      onClick={addFavoriteBook}
                      type="button"
                      size="lg"
                      className="rounded-2xl h-14 px-8 font-bold"
                    >
                      Record
                    </Button>
                  </div>
                  {favoriteBooks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {favoriteBooks.map((book) => (
                        <motion.div
                          key={book}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-3 bg-card border border-border/50 text-foreground px-5 py-2 rounded-2xl text-xs font-bold shadow-md"
                        >
                          <Star className="w-3 h-3 text-primary" />
                          <span>{book}</span>
                          <button
                            onClick={() => removeFavoriteBook(book)}
                            className="text-muted-foreground hover:text-destructive ml-2"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {currentStep === 6 && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-8 text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/40 rotate-12">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black italic tracking-tighter">
                      Welcome Home traveler.
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
                      Your Trove has been initialized. A world of knowledge is now at your
                      fingertips.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-12 pt-8 border-t border-border/30">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="rounded-full h-12 px-8 font-bold opacity-60 hover:opacity-100 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return
              </Button>
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={loading || (currentStep === 2 && !nickname.trim())}
                  className="rounded-full shadow-2xl shadow-primary/30 h-14 px-10 text-lg font-black italic"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="rounded-full shadow-2xl shadow-primary/40 h-16 px-12 text-xl font-black italic bg-primary scale-105 hover:scale-110 transition-transform"
                >
                  {loading ? 'Initializing...' : 'Begin Journey'}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
