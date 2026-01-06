import { Button } from '@/components/ui/button';
import { User, Monitor, RotateCcw, BookOpen, Volume2, VolumeX, Globe, Check, Download } from 'lucide-react';
import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';
import { GameMode, AIDifficulty } from '@/hooks/useGameLogic';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

interface GameSidebarProps {
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  soundEnabled: boolean;
  isLANMode?: boolean;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (difficulty: AIDifficulty) => void;
  onToggleSound: () => void;
  onNewGame: () => void;
  onOpenRules: () => void;
  onOpenLAN?: () => void;
}

export function GameSidebar({ 
  currentMode, 
  currentDifficulty,
  soundEnabled,
  isLANMode,
  onSelectMode, 
  onSelectDifficulty,
  onToggleSound,
  onNewGame, 
  onOpenRules,
  onOpenLAN,
}: GameSidebarProps) {
  const { isPWAInstallable, isInstalled, installApp } = usePWAInstall();
  const modes: { mode: GameMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      mode: 'pvp',
      label: 'VS Player 2',
      icon: <User className="w-5 h-5" />,
      description: 'Play locally',
    },
    {
      mode: 'vs-computer',
      label: 'VS Computer',
      icon: <Monitor className="w-5 h-5" />,
      description: 'Play as Goat vs AI',
    },
    {
      mode: 'vs-tiger',
      label: 'VS Tiger',
      icon: <img src={tigerIcon} alt="Tiger" className="w-5 h-5 object-contain" />,
      description: 'Play as Goat',
    },
    {
      mode: 'vs-goat',
      label: 'VS Goat',
      icon: <img src={goatIcon} alt="Goat" className="w-5 h-5 object-contain" />,
      description: 'Play as Tiger',
    },
  ];

  const difficulties: { level: AIDifficulty; label: string; color: string }[] = [
    { level: 'easy', label: 'Easy', color: 'text-green-500' },
    { level: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { level: 'hard', label: 'Hard', color: 'text-red-500' },
  ];

  const showDifficulty = currentMode !== 'pvp';

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4 border-b border-border/50">
        <h1 className="text-2xl font-display text-gradient tracking-wider">
          Bagchal
        </h1>
        <p className="text-xs text-muted-foreground">Tiger & Goat</p>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-display">Game Mode</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modes.map(({ mode, label, icon, description }) => (
                <SidebarMenuItem key={mode}>
                  <SidebarMenuButton 
                    onClick={() => {
                      onSelectMode(mode);
                      onNewGame();
                    }}
                    isActive={currentMode === mode}
                    className={`w-full transition-all duration-200 ${
                      currentMode === mode 
                        ? 'bg-primary/15 ring-2 ring-primary/40 scale-[1.02]' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        currentMode === mode ? 'bg-primary/30 text-primary' : 'bg-primary/20 text-primary'
                      }`}>
                        {icon}
                      </div>
                      <div className="text-left flex-1">
                        <div className={`font-medium text-sm flex items-center gap-1.5 ${
                          currentMode === mode ? 'text-primary' : ''
                        }`}>
                          {label}
                          {currentMode === mode && (
                            <Check className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showDifficulty && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-display">AI Difficulty</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex gap-2 px-2">
                {difficulties.map(({ level, label, color }) => (
                  <Button
                    key={level}
                    variant={currentDifficulty === level ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 ${currentDifficulty === level ? '' : color}`}
                    onClick={() => {
                      onSelectDifficulty(level);
                      onNewGame();
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-display">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onToggleSound}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Sound On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Sound Off
                  </>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 space-y-2 border-t border-border/50">
        {isPWAInstallable && !isInstalled && (
          <Button 
            variant="outline"
            size="sm"
            className="w-full"
            onClick={installApp}
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
        )}
        <Button 
          variant={isLANMode ? "default" : "outline"}
          size="sm"
          className="w-full"
          onClick={onOpenLAN}
        >
          <Globe className="w-4 h-4 mr-2" />
          Play Online
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={onOpenRules}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Rules
        </Button>
        <Button 
          variant="game" 
          size="sm"
          className="w-full"
          onClick={onNewGame}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
