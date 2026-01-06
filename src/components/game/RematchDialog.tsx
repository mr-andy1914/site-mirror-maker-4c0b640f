import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCcw, X } from 'lucide-react';

interface RematchDialogProps {
  open: boolean;
  requestedBy: 'host' | 'guest' | null;
  isHost: boolean;
  playerName: string;
  opponentName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function RematchDialog({
  open,
  requestedBy,
  isHost,
  playerName,
  opponentName,
  onAccept,
  onDecline,
}: RematchDialogProps) {
  // Don't show if we're the one who requested
  const weRequested = (isHost && requestedBy === 'host') || (!isHost && requestedBy === 'guest');

  if (weRequested) {
    return (
      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary animate-spin" />
              Waiting for Response
            </AlertDialogTitle>
            <AlertDialogDescription>
              Waiting for {opponentName || 'opponent'} to accept your rematch request...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onDecline}>Cancel Request</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Rematch Request
          </AlertDialogTitle>
          <AlertDialogDescription>
            {opponentName || 'Your opponent'} wants a rematch! Roles will be swapped for the next game.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline} className="gap-2">
            <X className="h-4 w-4" />
            Decline
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Accept Rematch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
