import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wifi, Loader2, ArrowRight, Copy, Check, Eye } from 'lucide-react';
import { ConnectionState, PlayerRole, TimerSettings } from '@/hooks/useLANMultiplayer';
import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';
import { toast } from '@/hooks/use-toast';

interface LANGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionState: ConnectionState;
  roomCode: string;
  error: string | null;
  isHost: boolean;
  onCreateRoom: (role: PlayerRole, name: string, timer: TimerSettings) => void;
  onJoinRoom: (code: string, name: string, asSpectator?: boolean) => void;
  onDisconnect: () => void;
}

export function LANGameModal({
  open,
  onOpenChange,
  connectionState,
  roomCode,
  error,
  onCreateRoom,
  onJoinRoom,
  onDisconnect,
}: LANGameModalProps) {
  const [step, setStep] = useState<'choose' | 'host' | 'join'>('choose');
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('goat');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('bagchal-player-name');
    if (savedName) setPlayerName(savedName);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('choose');
      setJoinCode('');
      setCopied(false);
      setJoinAsSpectator(false);
    }
  }, [open]);

  // Close modal when connected
  useEffect(() => {
    if (connectionState === 'connected') {
      toast({ title: 'Connected!', description: 'Game is ready to start' });
      onOpenChange(false);
    }
  }, [connectionState, onOpenChange]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoom = () => {
    const name = playerName.trim() || 'Host';
    localStorage.setItem('bagchal-player-name', name);
    onCreateRoom(selectedRole, name, { enabled: timerEnabled, seconds: timerSeconds });
  };

  const handleJoinRoom = () => {
    if (joinCode.length === 5) {
      const name = playerName.trim() || 'Guest';
      localStorage.setItem('bagchal-player-name', name);
      onJoinRoom(joinCode, name, joinAsSpectator);
    }
  };

  const handleBack = () => {
    onDisconnect();
    setStep('choose');
    setJoinCode('');
  };

  // Choose screen
  if (step === 'choose') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              LAN Multiplayer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Your Name</Label>
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Play with a friend
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-3"
                onClick={() => setStep('host')}
              >
                <span className="text-2xl">📡</span>
                <div className="text-center">
                  <div className="font-medium">Create Game</div>
                  <div className="text-xs text-muted-foreground">Get a code</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-3"
                onClick={() => setStep('join')}
              >
                <span className="text-2xl">🔗</span>
                <div className="text-center">
                  <div className="font-medium">Join Game</div>
                  <div className="text-xs text-muted-foreground">Enter code</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Host screen
  if (step === 'host') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Game</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {connectionState === 'idle' || connectionState === 'creating' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose your side:</p>
              
              <div className="flex gap-3">
                <Button
                  variant={selectedRole === 'tiger' ? 'default' : 'outline'}
                  className="flex-1 h-16 flex-col gap-1"
                  onClick={() => setSelectedRole('tiger')}
                >
                  <img src={tigerIcon} alt="Tiger" className="w-8 h-8 object-contain" />
                  <span className="text-xs">Tiger</span>
                </Button>
                <Button
                  variant={selectedRole === 'goat' ? 'default' : 'outline'}
                  className="flex-1 h-16 flex-col gap-1"
                  onClick={() => setSelectedRole('goat')}
                >
                  <img src={goatIcon} alt="Goat" className="w-8 h-8 object-contain" />
                  <span className="text-xs">Goat</span>
                </Button>
              </div>

              {/* Timer Settings */}
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="timer-toggle" className="text-sm">Turn Timer</Label>
                  <Switch
                    id="timer-toggle"
                    checked={timerEnabled}
                    onCheckedChange={setTimerEnabled}
                  />
                </div>
                {timerEnabled && (
                  <Select value={timerSeconds.toString()} onValueChange={(v) => setTimerSeconds(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateRoom}
                disabled={connectionState === 'creating'}
              >
                {connectionState === 'creating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Create Room <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          ) : connectionState === 'waiting' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Share this code with your friend:
              </p>
              
              <div className="flex justify-center">
                <div className="text-5xl font-mono font-bold tracking-widest text-primary">
                  {roomCode}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Code
              </Button>

              <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for player...</span>
              </div>
            </div>
          ) : null}

          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Join screen
  if (step === 'join') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join Game</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the 5-digit code:</p>
            
            <Input
              type="text"
              maxLength={5}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              placeholder="12345"
              className="text-center text-3xl font-mono tracking-widest h-16"
              autoFocus
            />

            {/* Spectator toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="spectator-toggle" className="text-sm">Join as Spectator</Label>
              </div>
              <Switch
                id="spectator-toggle"
                checked={joinAsSpectator}
                onCheckedChange={setJoinAsSpectator}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleJoinRoom}
              disabled={joinCode.length !== 5 || connectionState === 'joining'}
            >
              {connectionState === 'joining' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>{joinAsSpectator ? 'Watch' : 'Join'} <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
