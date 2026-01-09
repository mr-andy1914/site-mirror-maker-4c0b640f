import { cn } from '@/lib/utils';
import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';
import { Position, Piece } from '@/hooks/useGameLogic';
import { MoveAnimation } from '@/hooks/useLANMultiplayer';
import { useEffect, useState, useRef } from 'react';

const BOARD_SIZE = 5;

interface GameBoardProps {
  tigers: Piece[];
  goats: Piece[];
  goatsToPlace: number;
  currentTurn: 'tiger' | 'goat';
  selectedPiece: Piece | null;
  onNodeClick: (row: number, col: number) => void;
  onPieceSelect: (piece: Piece) => void;
  validMoves: Position[];
  isAIThinking?: boolean;
  lastMove?: MoveAnimation | null;
}

interface AnimatedPiece extends Piece {
  animatingFrom?: Position;
}

export function GameBoard({
  tigers,
  goats,
  currentTurn,
  selectedPiece,
  onNodeClick,
  onPieceSelect,
  validMoves,
  isAIThinking,
  lastMove,
}: GameBoardProps) {
  const [dimensions, setDimensions] = useState({ cellSize: 100, padding: 50 });
  const [animatingPiece, setAnimatingPiece] = useState<AnimatedPiece | null>(null);
  const [animationKey, setAnimationKey] = useState(0); // Force re-render for animation
  const [fadingGoat, setFadingGoat] = useState<Position | null>(null);
  const prevTigersRef = useRef(tigers);
  const prevGoatsRef = useRef(goats);

  // Calculate responsive dimensions
  useEffect(() => {
    const calculateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let availableSize: number;
      
      if (width < 480) {
        availableSize = Math.min(width - 32, height - 200);
      } else if (width < 768) {
        availableSize = Math.min(width - 48, height - 220);
      } else if (width < 1024) {
        availableSize = Math.min(width - 300, height - 200, 500);
      } else {
        availableSize = Math.min(width - 400, height - 200, 500);
      }
      
      availableSize = Math.max(availableSize, 280);
      
      const cellSize = Math.floor((availableSize * 0.85) / (BOARD_SIZE - 1));
      const padding = Math.floor(cellSize * 0.5);
      
      setDimensions({ cellSize: Math.max(cellSize, 55), padding: Math.max(padding, 25) });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  // Handle move animations from lastMove prop
  useEffect(() => {
    if (lastMove) {
      const piece: AnimatedPiece = {
        type: lastMove.pieceType,
        position: lastMove.to,
        animatingFrom: lastMove.from,
      };
      setAnimatingPiece(piece);
      
      if (lastMove.capturedAt) {
        setFadingGoat(lastMove.capturedAt);
      }
      
      const timer = setTimeout(() => {
        setAnimatingPiece(null);
        setFadingGoat(null);
      }, 350);
      
      return () => clearTimeout(timer);
    }
  }, [lastMove]);

  // Detect moves internally (for local games)
  useEffect(() => {
    // Skip if we have lastMove prop (animation handled by that)
    if (lastMove) {
      prevTigersRef.current = tigers;
      prevGoatsRef.current = goats;
      return;
    }
    
    // Check for tiger move - find the tiger that moved by comparing positions
    let movedTiger: typeof tigers[0] | undefined;
    let prevTigerPos: Position | undefined;
    
    for (const tiger of tigers) {
      const prevTiger = prevTigersRef.current.find(
        pt => !tigers.some(t => t.position.row === pt.position.row && t.position.col === pt.position.col)
      );
      if (prevTiger) {
        // This prevTiger no longer exists at its old position, find its new position
        const newTiger = tigers.find(
          t => !prevTigersRef.current.some(pt => pt.position.row === t.position.row && pt.position.col === t.position.col)
        );
        if (newTiger) {
          movedTiger = newTiger;
          prevTigerPos = prevTiger.position;
          break;
        }
      }
    }
    
    if (movedTiger && prevTigerPos) {
      const piece: AnimatedPiece = {
        ...movedTiger,
        animatingFrom: prevTigerPos,
      };
      setAnimatingPiece(piece);
      setAnimationKey(k => k + 1); // Trigger fresh animation
      setTimeout(() => setAnimatingPiece(null), 350);
    }
    
    // Check for captured goat
    if (goats.length < prevGoatsRef.current.length) {
      const capturedGoat = prevGoatsRef.current.find(
        prev => !goats.some(g => g.position.row === prev.position.row && g.position.col === prev.position.col)
      );
      if (capturedGoat) {
        setFadingGoat(capturedGoat.position);
        setTimeout(() => setFadingGoat(null), 300);
      }
    }
    
    prevTigersRef.current = tigers;
    prevGoatsRef.current = goats;
  }, [tigers, goats]);

  const { cellSize, padding } = dimensions;
  const boardWidth = (BOARD_SIZE - 1) * cellSize + padding * 2;
  const boardHeight = boardWidth;
  
  const pieceSize = Math.floor(cellSize * 0.6);
  const nodeRadius = Math.floor(cellSize * 0.1);
  const validNodeRadius = Math.floor(cellSize * 0.15);
  const selectionRadius = Math.floor(cellSize * 0.35);
  const strokeWidth = Math.max(2, Math.floor(cellSize * 0.03));

  const getNodePosition = (row: number, col: number) => ({
    x: padding + col * cellSize,
    y: padding + row * cellSize,
  });

  const getPieceAt = (row: number, col: number): Piece | null => {
    const tiger = tigers.find(t => t.position.row === row && t.position.col === col);
    if (tiger) return tiger;
    const goat = goats.find(g => g.position.row === row && g.position.col === col);
    return goat || null;
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  // Draw lines
  const lines: JSX.Element[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const { x, y } = getNodePosition(row, col);
      
      if (col < BOARD_SIZE - 1) {
        const { x: x2 } = getNodePosition(row, col + 1);
        lines.push(
          <line
            key={`h-${row}-${col}`}
            x1={x}
            y1={y}
            x2={x2}
            y2={y}
            stroke="hsl(var(--board-line))"
            strokeWidth={strokeWidth}
          />
        );
      }
      
      if (row < BOARD_SIZE - 1) {
        const { y: y2 } = getNodePosition(row + 1, col);
        lines.push(
          <line
            key={`v-${row}-${col}`}
            x1={x}
            y1={y}
            x2={x}
            y2={y2}
            stroke="hsl(var(--board-line))"
            strokeWidth={strokeWidth}
          />
        );
      }
      
      if ((row + col) % 2 === 0) {
        if (row < BOARD_SIZE - 1 && col < BOARD_SIZE - 1) {
          const { x: x2, y: y2 } = getNodePosition(row + 1, col + 1);
          lines.push(
            <line
              key={`d1-${row}-${col}`}
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--board-line))"
              strokeWidth={strokeWidth}
            />
          );
        }
        if (row < BOARD_SIZE - 1 && col > 0) {
          const { x: x2, y: y2 } = getNodePosition(row + 1, col - 1);
          lines.push(
            <line
              key={`d2-${row}-${col}`}
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--board-line))"
              strokeWidth={strokeWidth}
            />
          );
        }
      }
    }
  }

  // Draw nodes and pieces
  const nodes: JSX.Element[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const { x, y } = getNodePosition(row, col);
      const piece = getPieceAt(row, col);
      const isValid = isValidMove(row, col);
      const isSelected = selectedPiece?.position.row === row && selectedPiece?.position.col === col;
      
      // Check if this piece is being animated
      const isAnimating = animatingPiece && 
        animatingPiece.position.row === row && 
        animatingPiece.position.col === col;
      
      // Check if a goat at this position is fading out
      const isFading = fadingGoat && 
        fadingGoat.row === row && 
        fadingGoat.col === col;

      // Calculate animation transform
      let animationTransform = '';
      if (isAnimating && animatingPiece.animatingFrom) {
        const fromPos = getNodePosition(animatingPiece.animatingFrom.row, animatingPiece.animatingFrom.col);
        const dx = fromPos.x - x;
        const dy = fromPos.y - y;
        animationTransform = `translate(${dx}px, ${dy}px)`;
      }

      nodes.push(
        <g
          key={`node-${row}-${col}`}
          className={cn("cursor-pointer", isAIThinking && "pointer-events-none")}
          onClick={() => {
            if (isAIThinking) return;
            if (piece && piece.type === currentTurn) {
              onPieceSelect(piece);
            } else if (!piece || isValid) {
              onNodeClick(row, col);
            }
          }}
        >
          <circle
            cx={x}
            cy={y}
            r={isValid ? validNodeRadius : nodeRadius}
            fill={isValid ? 'hsl(var(--primary))' : 'hsl(var(--board-bg))'}
            stroke={isValid ? 'hsl(var(--node-glow))' : 'hsl(var(--node))'}
            strokeWidth={isValid ? strokeWidth + 1 : strokeWidth}
            className={cn(
              'transition-all duration-200',
              isValid && 'animate-pulse'
            )}
          />
          
          {/* Fading captured goat */}
          {isFading && (
            <image
              href={goatIcon}
              x={x - pieceSize / 2}
              y={y - pieceSize / 2}
              width={pieceSize}
              height={pieceSize}
              className="animate-fade-out"
              style={{
                opacity: 0,
                transition: 'opacity 0.3s ease-out',
              }}
            />
          )}
          
          {piece && !isFading && (
            <g 
              key={isAnimating ? `anim-${animationKey}` : undefined}
              className={cn(
                isSelected && 'drop-shadow-[0_0_20px_hsl(var(--primary))]'
              )}
              style={isAnimating && animatingPiece?.animatingFrom ? {
                animation: 'piece-move 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                '--from-x': `${getNodePosition(animatingPiece.animatingFrom.row, animatingPiece.animatingFrom.col).x - x}px`,
                '--from-y': `${getNodePosition(animatingPiece.animatingFrom.row, animatingPiece.animatingFrom.col).y - y}px`,
              } as React.CSSProperties : undefined}
            >
              <image
                href={piece.type === 'tiger' ? tigerIcon : goatIcon}
                x={x - pieceSize / 2}
                y={y - pieceSize / 2}
                width={pieceSize}
                height={pieceSize}
                className={cn(
                  'transition-transform duration-200',
                  isSelected && 'scale-110',
                  piece.type === currentTurn && !isAIThinking && 'cursor-pointer hover:scale-105'
                )}
              />
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r={selectionRadius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={strokeWidth + 1}
                  className="animate-pulse"
                />
              )}
            </g>
          )}
        </g>
      );
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={boardWidth}
        height={boardHeight}
        className="rounded-xl sm:rounded-2xl shadow-card max-w-full"
        style={{ background: 'hsl(var(--board-bg))' }}
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
          <style>{`
            @keyframes piece-move {
              from {
                transform: translate(var(--from-x), var(--from-y));
              }
              to {
                transform: translate(0, 0);
              }
            }
          `}</style>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {lines}
        {nodes}
      </svg>
      
      {isAIThinking && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl sm:rounded-2xl">
          <div className="text-sm sm:text-lg font-display text-primary animate-pulse">
            Opponent thinking...
          </div>
        </div>
      )}
    </div>
  );
}
