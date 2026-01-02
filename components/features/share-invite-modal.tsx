'use client';

import { Check, Copy, Mail, MessageCircle, Share2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ShareMethod = 'clipboard' | 'whatsapp' | 'email' | 'direct-email';

export function ShareInviteModal() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Use useMemo to avoid recalculating the invite link on every render
  const inviteLink = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/invite/abc123`;
    }
    return 'https://trove.app/invite/abc123';
  }, []);

  const handleShareAction = useCallback(
    (method: ShareMethod) => {
      switch (method) {
        case 'clipboard':
          navigator.clipboard
            .writeText(inviteLink)
            .then(() => {
              setCopied(true);
              toast.success('Link copied to clipboard!');
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
              toast.error('Failed to copy to clipboard');
            });
          break;

        case 'whatsapp':
          const message = encodeURIComponent(
            `Join me on Trove - the best reading companion app! 📚\n\n${inviteLink}`
          );
          window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
          break;

        case 'email':
          const subject = encodeURIComponent('Join me on Trove!');
          const body = encodeURIComponent(
            `Hi!\n\nI've been using Trove to track my reading and I think you'd love it too!\n\n` +
              `Trove is a reading companion app that helps you:\n` +
              `- Track your reading progress\n` +
              `- Take notes and highlights\n` +
              `- View your reading analytics\n` +
              `- Join book communities\n\n` +
              `Join me here: ${inviteLink}\n\n` +
              `Happy reading! 📚`
          );
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
          break;
      }
    },
    [inviteLink]
  );

  const sendEmailInvite = useCallback(async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSending(false);
      setEmail('');
      toast.success(`Invite sent to ${email}!`);
    } catch (error) {
      console.error('Failed to send invite:', error);
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setSending(false);
    }
  }, [email]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" /> Share & Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trove with Friends</DialogTitle>
          <DialogDescription>
            Invite your friends to join Trove and discover amazing books together!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link">Your Invite Link</Label>
            <div className="flex gap-2">
              <Input id="link" value={inviteLink} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleShareAction('clipboard')}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Share</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShareAction('email')}
              >
                <Mail className="h-4 w-4" /> Email
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShareAction('whatsapp')}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Invite by Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={sendEmailInvite} disabled={!email || sending}>
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <p className="text-xs text-muted-foreground">
            Share your love of reading! Friends who join get a special welcome bonus.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
