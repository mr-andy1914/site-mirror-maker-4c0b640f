import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';
import { cn } from '@/lib/utils';

interface GameStatsProps {
  goatsAvailable: number;
  goatsOnBoard: number;
  goatsCaptured: number;
  tigersTrapped: number;
  currentTurn: 'tiger' | 'goat';
}

export function GameStats({
  goatsAvailable,
  goatsOnBoard,
  goatsCaptured,
  tigersTrapped,
  currentTurn,
}: GameStatsProps) {
  return (
    <div className="card-gradient rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-card space-y-3 sm:space-y-6">
      <h2 className="text-base sm:text-xl font-display text-primary text-center">Game Stats</h2>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Current Turn - Hidden on mobile as it's shown above the board */}
        <div className="hidden sm:flex items-center justify-center gap-3 p-3 rounded-xl bg-muted/50">
          <span className="text-muted-foreground text-sm">Current Turn:</span>
          <div className="flex items-center gap-2">
            <img 
              src={currentTurn === 'tiger' ? tigerIcon : goatIcon} 
              alt={currentTurn}
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
            />
            <span className={cn(
              "font-display uppercase tracking-wider text-sm sm:text-base",
              currentTurn === 'tiger' ? 'text-tiger' : 'text-goat'
            )}>
              {currentTurn === 'tiger' ? 'Tiger' : 'Goat'}
            </span>
          </div>
        </div>

        {/* Goat Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src={goatIcon} alt="Goat" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            <span className="font-display text-goat text-sm sm:text-base">Goats</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <div className="flex justify-between p-1.5 sm:p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Place:</span>
              <span className="font-bold text-foreground">{goatsAvailable}/20</span>
            </div>
            <div className="flex justify-between p-1.5 sm:p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Board:</span>
              <span className="font-bold text-foreground">{goatsOnBoard}</span>
            </div>
          </div>
          
          <div className="flex justify-between p-1.5 sm:p-2 rounded-lg bg-destructive/20 text-xs sm:text-sm">
            <span className="text-destructive">Captured:</span>
            <span className="font-bold text-destructive">{goatsCaptured}/5</span>
          </div>
        </div>

        {/* Tiger Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src={tigerIcon} alt="Tiger" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            <span className="font-display text-tiger text-sm sm:text-base">Tigers</span>
          </div>
          
          <div className="flex justify-between p-1.5 sm:p-2 rounded-lg bg-primary/20 text-xs sm:text-sm">
            <span className="text-primary">Trapped:</span>
            <span className="font-bold text-primary">{tigersTrapped}/4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
