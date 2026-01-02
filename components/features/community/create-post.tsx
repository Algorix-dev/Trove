'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ImagePlus, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

export function CreatePost({
  user,
  communityId,
  onPostCreated,
}: {
  user: any;
  communityId: string;
  onPostCreated: () => void;
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        community_id: communityId,
        content: content.trim(),
      });

      if (error) throw error;

      toast.success('Post shared with the trove!');
      setContent('');
      setIsExpanded(false);
      onPostCreated();
    } catch (error) {
      toast.error('Failed to share your thoughts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-2xl overflow-hidden mb-8"
    >
      <div className="flex gap-4">
        <Avatar className="w-12 h-12 shadow-inner border-2 border-primary/20">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {user?.email?.[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          <Textarea
            placeholder="What's on your mind, fellow reader?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="bg-transparent border-none focus-visible:ring-0 text-lg resize-none p-0 min-h-[60px]"
          />

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center justify-between pt-4 border-t border-border/30"
              >
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setIsExpanded(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={loading || !content.trim()}
                    onClick={handlePost}
                    className="rounded-full px-6 shadow-lg shadow-primary/20 bg-primary hover:scale-105 transition-transform"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Share Lore
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
