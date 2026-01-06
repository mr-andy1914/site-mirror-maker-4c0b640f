import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';

interface RulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RulesModal({ open, onOpenChange }: RulesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto card-gradient border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-3xl font-display text-gradient text-center">
            Bagchal - Tiger & Goat
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            An ancient strategic board game from Nepal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 text-foreground/90">
          <p className="text-center text-muted-foreground">
            A two-player game where tigers hunt goats, and goats try to trap the tigers.
            The game is played on a 5×5 grid with 25 intersections.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-xl font-display text-primary">General Rules</h3>
            
            <div className="p-4 rounded-xl bg-muted/30 space-y-2">
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>The board has 25 intersections where pieces can be placed</li>
                <li>There are 4 tigers and 20 goats</li>
                <li>Pieces move along lines to adjacent intersections</li>
                <li>Players take turns alternately</li>
                <li>Diagonal moves are only allowed on certain positions (corners and center)</li>
              </ul>
            </div>
            
            {/* Goat Rules */}
            <div className="p-4 rounded-xl bg-muted/30 space-y-3">
              <div className="flex items-center gap-3">
                <img src={goatIcon} alt="Goat" className="w-12 h-12" />
                <h4 className="text-lg font-display text-goat">Goat Player</h4>
              </div>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Phase 1:</strong> Place all 20 goats one at a time on empty intersections</li>
                <li><strong>Phase 2:</strong> After all goats are placed, move them along lines</li>
                <li>Goats cannot jump over tigers or other goats</li>
                <li>Goats move one intersection at a time</li>
                <li className="text-primary font-medium">Win by trapping all 4 tigers so they cannot move</li>
              </ul>
            </div>
            
            {/* Tiger Rules */}
            <div className="p-4 rounded-xl bg-muted/30 space-y-3">
              <div className="flex items-center gap-3">
                <img src={tigerIcon} alt="Tiger" className="w-12 h-12" />
                <h4 className="text-lg font-display text-tiger">Tiger Player</h4>
              </div>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>4 tigers start at the four corners of the board</li>
                <li>Tigers can move one intersection at a time along lines</li>
                <li>Tigers capture goats by jumping over them to an empty space</li>
                <li>Can only capture one goat per turn</li>
                <li>Cannot jump over another tiger</li>
                <li className="text-primary font-medium">Win by capturing 5 goats</li>
              </ul>
            </div>
            
            {/* Strategy Tips */}
            <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
              <h4 className="text-lg font-display text-accent">Strategy Tips</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Goats:</strong> Control the center and edges to limit tiger movement</li>
                <li><strong>Tigers:</strong> Keep mobile and look for capture opportunities early</li>
                <li>Diagonal positions are powerful for both sides</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
