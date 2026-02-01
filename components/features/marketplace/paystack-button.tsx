'use client';

import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface PaystackButtonProps {
  email: string;
  amount: number;
  metadata?: any;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function PaystackButton({
  email,
  amount,
  metadata,
  onSuccess,
  onClose,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePaystackPayment = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: process.env['NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY'],
        email: email,
        amount: amount * 100, // Paystack works in Kobo
        currency: 'NGN',
        metadata: metadata,
        callback: (response: any) => {
          setLoading(false);
          onSuccess(response.reference);
        },
        onClose: () => {
          setLoading(false);
          onClose();
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error('Paystack Error:', error);
      setLoading(false);
      toast.error('Could not initialize payment');
    }
  };

  return (
    <>
      {/* Paystack Inline Script needs to be included in layout or here */}
      <script
        src="https://js.paystack.co/v1/inline.js"
        async
        onLoad={() => { }}
      />
      <Button
        onClick={handlePaystackPayment}
        disabled={loading}
        className="w-full bg-[#09A5DB] hover:bg-[#088fb9] text-white font-bold h-12 rounded-xl transition-all"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-5 w-5" />
        )}
        Pay with Paystack
      </Button>
    </>
  );
}
