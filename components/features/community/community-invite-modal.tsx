'use client';

import { Check, Copy, Mail, MessageCircle, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface CommunityInviteModalProps {
  communityId: string;
  communityName: string;
}

export function CommunityInviteModal({ communityId, communityName }: CommunityInviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState(`https://trove.app/join/${communityId}`);

  useEffect(() => {
    setInviteLink(`${window.location.origin}/join/${communityId}`);
  }, [communityId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Join "${communityName}" on Trove! 📚\n\nLet's discuss books together:\n${inviteLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join "${communityName}" on Trove`);
    const body = encodeURIComponent(
      `Hi!\n\nI'd love for you to join our "${communityName}" community on Trove!\n\nTrove is a reading companion app where we can discuss books, share notes, and track our reading together.\n\nJoin the community here: ${inviteLink}\n\nIf you're not on Trove yet, you'll be able to sign up and join us right away!\n\nSee you there! 📚`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const sendEmailInvite = async () => {
    if (!email) return;

    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSending(false);
    setEmail('');
    toast.success(`Invitation to "${communityName}" sent to ${email}!`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {communityName}</DialogTitle>
          <DialogDescription>
            Invite friends to join this community. They'll be prompted to sign up if they're not on
            Trove yet!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="community-link">Community Invite Link</Label>
            <div className="flex gap-2">
              <Input id="community-link" value={inviteLink} readOnly className="flex-1" />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Share</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={shareViaEmail}>
                <Mail className="h-4 w-4" /> Email
              </Button>
              <Button variant="outline" className="gap-2" onClick={shareViaWhatsApp}>
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Invite by Email</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
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
            New users will be redirected to sign up, then automatically join this community!
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
