import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Bot, Users, Globe, Gamepad2, Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface WelcomeScreenProps {
  onSelectMode: (mode: 'ai' | 'local' | 'online') => void;
  onClose: () => void;
}

const WelcomeScreen = ({ onSelectMode, onClose }: WelcomeScreenProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);
  const { isPWAInstallable, isInstalled, installApp } = usePWAInstall();

  // Check if user has dismissed welcome before
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('baghchal-welcome-seen');
    if (hasSeenWelcome && !isMobile) {
      setIsOpen(false);
      onClose();
    }
  }, [isMobile, onClose]);

  const handleSelectMode = (mode: 'ai' | 'local' | 'online') => {
    localStorage.setItem('baghchal-welcome-seen', 'true');
    setIsOpen(false);
    onSelectMode(mode);
  };

  const handleSkip = () => {
    localStorage.setItem('baghchal-welcome-seen', 'true');
    setIsOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Gamepad2 className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Bagh Chal</h1>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Tigers vs Goats - An ancient Nepali strategy game
            </p>
          </div>

          {/* Game Mode Selection */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-sm font-medium text-center text-muted-foreground">
              Choose how to play:
            </p>
            
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 hover:bg-primary/10 hover:border-primary/50 transition-all"
              onClick={() => handleSelectMode('ai')}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Play vs AI</span>
                <span className="text-xs text-muted-foreground">Challenge the computer</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 hover:bg-primary/10 hover:border-primary/50 transition-all"
              onClick={() => handleSelectMode('local')}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Play Locally</span>
                <span className="text-xs text-muted-foreground">Pass and play on same device</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 hover:bg-primary/10 hover:border-primary/50 transition-all"
              onClick={() => handleSelectMode('online')}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Play Online</span>
                <span className="text-xs text-muted-foreground">Connect with anyone worldwide</span>
              </div>
            </Button>

            {/* Install App Button */}
            {isPWAInstallable && !isInstalled && (
              <Button
                variant="secondary"
                className="w-full h-12 justify-start gap-4 mt-2"
                onClick={installApp}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Install App</span>
                  <span className="text-xs text-muted-foreground">Add to home screen</span>
                </div>
              </Button>
            )}
          </div>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeScreen;
