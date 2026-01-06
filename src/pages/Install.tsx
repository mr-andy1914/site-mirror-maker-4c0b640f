import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus, CheckCircle, Smartphone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const { isPWAInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    await installApp();
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h1 className="text-2xl font-bold">App Installed!</h1>
          <p className="text-muted-foreground">
            Bagh Chal is installed on your device. You can find it on your home screen.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <Smartphone className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold">Install Bagh Chal</h1>
        <p className="text-muted-foreground">
          Add the app to your home screen for the best experience - play offline, faster loading, and feels like a native app!
        </p>

        {isPWAInstallable && (
          <Button size="lg" onClick={handleInstall} className="gap-2">
            <Download className="w-5 h-5" />
            Install App
          </Button>
        )}

        {isIOS && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-4 w-full">
            <h2 className="font-semibold">iOS Installation Steps:</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap the <Share className="w-4 h-4 inline text-primary" /> Share button in Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  Scroll down and tap <Plus className="w-4 h-4 inline text-primary" /> "Add to Home Screen"
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap "Add" in the top right corner
                </p>
              </div>
            </div>
          </div>
        )}

        {!isPWAInstallable && !isIOS && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 w-full">
            <h2 className="font-semibold">How to install:</h2>
            <p className="text-sm text-muted-foreground">
              Look for the install icon in your browser's address bar, or use your browser's menu to "Add to Home Screen" or "Install App".
            </p>
          </div>
        )}

        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Game
        </Button>
      </div>
    </div>
  );
};

export default Install;
