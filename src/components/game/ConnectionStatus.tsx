import { Wifi, WifiOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionState, PlayerRole, MatchScore } from '@/hooks/useLANMultiplayer';
import { TurnTimer } from './TurnTimer';
import { SpectatorBadge } from './SpectatorBadge';
import { cn } from '@/lib/utils';
import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  playerRole: PlayerRole | null;
  isMyTurn: boolean;
  onDisconnect: () => void;
  playerName?: string;
  opponentName?: string;
  timerEnabled?: boolean;
  timerValue?: number;
  timerIsLow?: boolean;
  matchScore?: MatchScore;
  spectatorCount?: number;
  isHost?: boolean;
}

export function ConnectionStatus({
  connectionState,
  playerRole,
  isMyTurn,
  onDisconnect,
  playerName,
  opponentName,
  timerEnabled = false,
  timerValue = 30,
  timerIsLow = false,
  matchScore,
  spectatorCount = 0,
  isHost,
}: ConnectionStatusProps) {
  const isConnected = connectionState === 'connected';
  const isSpectator = playerRole === 'spectator';

  if (!isConnected) return null;

  return (
    <div className={cn(
      'p-3 sm:p-4 rounded-xl card-gradient shadow-card space-y-3',
      'border border-green-500/30'
    )}>
      {/* Connection status and disconnect */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wifi className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm font-medium text-green-500 truncate">
            {isSpectator ? 'Watching' : 'Connected'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDisconnect}
        >
          <LogOut className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Leave</span>
        </Button>
      </div>

      {/* Player names and roles */}
      {!isSpectator && (
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* You */}
          <div className={cn(
            'flex items-center gap-2 p-2 rounded-lg flex-1 min-w-0 transition-all',
            isMyTurn && 'bg-primary/20 ring-2 ring-primary'
          )}>
            <img
              src={playerRole === 'tiger' ? tigerIcon : goatIcon}
              alt={playerRole || ''}
              className="w-6 h-6 object-contain shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">You</div>
              <div className="text-sm font-medium truncate">{playerName || (isHost ? 'Host' : 'Guest')}</div>
            </div>
            {matchScore && (
              <div className="text-lg font-bold text-primary">{isHost ? matchScore.host : matchScore.guest}</div>
            )}
          </div>

          <span className="text-muted-foreground text-xs font-medium">vs</span>

          {/* Opponent */}
          <div className={cn(
            'flex items-center gap-2 p-2 rounded-lg flex-1 min-w-0 transition-all',
            !isMyTurn && 'bg-primary/20 ring-2 ring-primary'
          )}>
            <img
              src={playerRole === 'tiger' ? goatIcon : tigerIcon}
              alt={playerRole === 'tiger' ? 'goat' : 'tiger'}
              className="w-6 h-6 object-contain shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Opponent</div>
              <div className="text-sm font-medium truncate">{opponentName || (isHost ? 'Guest' : 'Host')}</div>
            </div>
            {matchScore && (
              <div className="text-lg font-bold text-muted-foreground">{isHost ? matchScore.guest : matchScore.host}</div>
            )}
          </div>
        </div>
      )}

      {/* Timer and spectators row */}
      {(timerEnabled || spectatorCount > 0) && (
        <div className="flex items-center justify-between gap-2">
          <TurnTimer
            timeLeft={timerValue}
            isLow={timerIsLow}
            enabled={timerEnabled}
          />
          <SpectatorBadge count={spectatorCount} />
        </div>
      )}

      {/* Spectator message */}
      {isSpectator && (
        <div className="text-center text-sm text-muted-foreground py-1">
          You are watching the game
        </div>
      )}
    </div>
  );
}
