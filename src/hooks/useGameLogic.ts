import { useState, useCallback, useEffect } from 'react';
import { useGameAI, AIDifficulty } from './useGameAI';
import { useSoundEffects } from './useSoundEffects';

export type Position = { row: number; col: number };
export type Piece = { type: 'tiger' | 'goat'; position: Position };
export type GameMode = 'pvp' | 'vs-computer' | 'vs-tiger' | 'vs-goat';
export type { AIDifficulty };

const INITIAL_TIGERS: Piece[] = [
  { type: 'tiger', position: { row: 0, col: 0 } },
  { type: 'tiger', position: { row: 0, col: 4 } },
  { type: 'tiger', position: { row: 4, col: 0 } },
  { type: 'tiger', position: { row: 4, col: 4 } },
];

const hasDiagonal = (row: number, col: number, targetRow: number, targetCol: number): boolean => {
  const rowDiff = Math.abs(row - targetRow);
  const colDiff = Math.abs(col - targetCol);
  
  if (rowDiff !== 1 || colDiff !== 1) return false;
  
  const srcSum = row + col;
  const tgtSum = targetRow + targetCol;
  
  return srcSum % 2 === 0 && tgtSum % 2 === 0;
};

const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < 5 && col >= 0 && col < 5;
};

const canJumpDiagonally = (fromRow: number, fromCol: number, midRow: number, midCol: number, toRow: number, toCol: number): boolean => {
  return hasDiagonal(fromRow, fromCol, midRow, midCol) && hasDiagonal(midRow, midCol, toRow, toCol);
};

export function useGameLogic() {
  const [tigers, setTigers] = useState<Piece[]>(INITIAL_TIGERS);
  const [goats, setGoats] = useState<Piece[]>([]);
  const [goatsToPlace, setGoatsToPlace] = useState(20);
  const [goatsCaptured, setGoatsCaptured] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<'tiger' | 'goat'>('goat');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { getTigerAIMove, getGoatAIPlacement, getGoatAIMove } = useGameAI(difficulty);
  const { playSound, setEnabled: setSoundEffectsEnabled } = useSoundEffects();

  // Sync sound enabled state
  useEffect(() => {
    setSoundEffectsEnabled(soundEnabled);
  }, [soundEnabled, setSoundEffectsEnabled]);

  const isOccupied = useCallback((row: number, col: number) => {
    return tigers.some(t => t.position.row === row && t.position.col === col) ||
           goats.some(g => g.position.row === row && g.position.col === col);
  }, [tigers, goats]);

  const isOccupiedByGoat = useCallback((row: number, col: number) => {
    return goats.some(g => g.position.row === row && g.position.col === col);
  }, [goats]);

  const getValidMoves = useCallback((piece: Piece): Position[] => {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (!isValidPosition(newRow, newCol)) continue;
      
      const isDiagonal = Math.abs(dr) === 1 && Math.abs(dc) === 1;
      if (isDiagonal && !hasDiagonal(row, col, newRow, newCol)) continue;
      
      if (!isOccupied(newRow, newCol)) {
        moves.push({ row: newRow, col: newCol });
      }
      
      if (piece.type === 'tiger') {
        const jumpRow = row + dr * 2;
        const jumpCol = col + dc * 2;
        
        if (isValidPosition(jumpRow, jumpCol)) {
          const midRow = row + dr;
          const midCol = col + dc;
          
          const hasGoatToCapture = isOccupiedByGoat(midRow, midCol);
          
          if (hasGoatToCapture && !isOccupied(jumpRow, jumpCol)) {
            if (isDiagonal) {
              if (canJumpDiagonally(row, col, midRow, midCol, jumpRow, jumpCol)) {
                moves.push({ row: jumpRow, col: jumpCol });
              }
            } else {
              moves.push({ row: jumpRow, col: jumpCol });
            }
          }
        }
      }
    }
    
    return moves;
  }, [goats, isOccupied, isOccupiedByGoat]);

  const checkWinCondition = useCallback((capturedCount: number, currentTigers: Piece[], currentGoats: Piece[], playerWon: 'tiger' | 'goat' | null = null) => {
    if (capturedCount >= 5) {
      setGameOver('Tigers Win! 5 goats have been captured.');
      playSound(playerWon === 'tiger' ? 'win' : 'lose');
      return true;
    }
    
    const anyTigerCanMove = currentTigers.some(tiger => {
      const { row, col } = tiger.position;
      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ];
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (!isValidPosition(newRow, newCol)) continue;
        
        const isDiagonal = Math.abs(dr) === 1 && Math.abs(dc) === 1;
        if (isDiagonal && !hasDiagonal(row, col, newRow, newCol)) continue;
        
        const occupied = currentTigers.some(t => t.position.row === newRow && t.position.col === newCol) ||
                        currentGoats.some(g => g.position.row === newRow && g.position.col === newCol);
        
        if (!occupied) return true;
        
        const jumpRow = row + dr * 2;
        const jumpCol = col + dc * 2;
        
        if (isValidPosition(jumpRow, jumpCol)) {
          const midRow = row + dr;
          const midCol = col + dc;
          
          const hasGoatToCapture = currentGoats.some(g => g.position.row === midRow && g.position.col === midCol);
          const jumpOccupied = currentTigers.some(t => t.position.row === jumpRow && t.position.col === jumpCol) ||
                              currentGoats.some(g => g.position.row === jumpRow && g.position.col === jumpCol);
          
          if (hasGoatToCapture && !jumpOccupied) {
            if (isDiagonal) {
              if (canJumpDiagonally(row, col, midRow, midCol, jumpRow, jumpCol)) {
                return true;
              }
            } else {
              return true;
            }
          }
        }
      }
      return false;
    });
    
    if (!anyTigerCanMove) {
      setGameOver('Goats Win! All tigers are trapped.');
      playSound(playerWon === 'goat' ? 'win' : 'lose');
      return true;
    }
    
    return false;
  }, [playSound]);

  // Check if it's AI's turn
  const isAITurn = useCallback(() => {
    if (gameMode === 'pvp') return false;
    if (gameMode === 'vs-computer') return currentTurn === 'tiger';
    if (gameMode === 'vs-tiger') return currentTurn === 'tiger';
    if (gameMode === 'vs-goat') return currentTurn === 'goat';
    return false;
  }, [gameMode, currentTurn]);

  // Execute AI move
  const executeAIMove = useCallback(() => {
    if (gameOver || !isAITurn()) return;

    setIsAIThinking(true);

    const delay = difficulty === 'hard' ? 800 : difficulty === 'medium' ? 500 : 300;

    setTimeout(() => {
      if (currentTurn === 'tiger') {
        const aiMove = getTigerAIMove(tigers, goats);
        if (aiMove) {
          const { tiger, to } = aiMove;
          const { row: fromRow, col: fromCol } = tiger.position;
          const rowDiff = Math.abs(to.row - fromRow);
          const colDiff = Math.abs(to.col - fromCol);
          
          let newGoats = goats;
          let newCaptured = goatsCaptured;
          
          if (rowDiff === 2 || colDiff === 2) {
            const midRow = (to.row + fromRow) / 2;
            const midCol = (to.col + fromCol) / 2;
            newGoats = goats.filter(g => !(g.position.row === midRow && g.position.col === midCol));
            newCaptured = goatsCaptured + 1;
            setGoats(newGoats);
            setGoatsCaptured(newCaptured);
            playSound('capture');
          } else {
            playSound('move');
          }
          
          const newTigers = tigers.map(t => 
            t.position.row === fromRow && t.position.col === fromCol
              ? { ...t, position: to }
              : t
          );
          setTigers(newTigers);
          setCurrentTurn('goat');
          
          setTimeout(() => checkWinCondition(newCaptured, newTigers, newGoats, 'goat'), 50);
        }
      } else {
        // Goat AI
        if (goatsToPlace > 0) {
          const placement = getGoatAIPlacement(tigers, goats);
          if (placement) {
            const newGoats = [...goats, { type: 'goat' as const, position: placement }];
            setGoats(newGoats);
            setGoatsToPlace(prev => prev - 1);
            setCurrentTurn('tiger');
            playSound('place');
            setTimeout(() => checkWinCondition(goatsCaptured, tigers, newGoats, 'tiger'), 50);
          }
        } else {
          const aiMove = getGoatAIMove(tigers, goats);
          if (aiMove) {
            const { goat, to } = aiMove;
            const { row: fromRow, col: fromCol } = goat.position;
            const newGoats = goats.map(g => 
              g.position.row === fromRow && g.position.col === fromCol
                ? { ...g, position: to }
                : g
            );
            setGoats(newGoats);
            setCurrentTurn('tiger');
            playSound('move');
            setTimeout(() => checkWinCondition(goatsCaptured, tigers, newGoats, 'tiger'), 50);
          }
        }
      }
      
      setIsAIThinking(false);
    }, delay);
  }, [currentTurn, tigers, goats, goatsToPlace, goatsCaptured, gameOver, isAITurn, difficulty, getTigerAIMove, getGoatAIPlacement, getGoatAIMove, checkWinCondition, playSound]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (isAITurn() && !gameOver && !isAIThinking) {
      executeAIMove();
    }
  }, [currentTurn, gameMode, gameOver, isAITurn, isAIThinking, executeAIMove]);

  const handleNodeClick = useCallback((row: number, col: number) => {
    if (gameOver || isAIThinking) return;
    if (isAITurn()) return; // Don't allow clicks during AI turn
    
    if (currentTurn === 'goat' && goatsToPlace > 0 && !selectedPiece) {
      if (!isOccupied(row, col)) {
        const newGoats = [...goats, { type: 'goat' as const, position: { row, col } }];
        setGoats(newGoats);
        setGoatsToPlace(prev => prev - 1);
        setCurrentTurn('tiger');
        playSound('place');
        setTimeout(() => checkWinCondition(goatsCaptured, tigers, newGoats, 'tiger'), 50);
        return;
      } else {
        playSound('invalid');
      }
    }
    
    if (selectedPiece) {
      const validMoves = getValidMoves(selectedPiece);
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValidMove) {
        const { row: fromRow, col: fromCol } = selectedPiece.position;
        let newCapturedCount = goatsCaptured;
        let newGoats = goats;
        let newTigers = tigers;
        
        if (selectedPiece.type === 'tiger') {
          const rowDiff = Math.abs(row - fromRow);
          const colDiff = Math.abs(col - fromCol);
          
          if (rowDiff === 2 || colDiff === 2) {
            const midRow = (row + fromRow) / 2;
            const midCol = (col + fromCol) / 2;
            
            newGoats = goats.filter(g => !(g.position.row === midRow && g.position.col === midCol));
            setGoats(newGoats);
            newCapturedCount = goatsCaptured + 1;
            setGoatsCaptured(newCapturedCount);
            playSound('capture');
          } else {
            playSound('move');
          }
        } else {
          playSound('move');
        }
        
        if (selectedPiece.type === 'tiger') {
          newTigers = tigers.map(t => 
            t.position.row === fromRow && t.position.col === fromCol
              ? { ...t, position: { row, col } }
              : t
          );
          setTigers(newTigers);
        } else {
          newGoats = goats.map(g => 
            g.position.row === fromRow && g.position.col === fromCol
              ? { ...g, position: { row, col } }
              : g
          );
          setGoats(newGoats);
        }
        
        const playerType = selectedPiece.type === 'tiger' ? 'goat' : 'tiger';
        setSelectedPiece(null);
        setCurrentTurn(prev => prev === 'tiger' ? 'goat' : 'tiger');
        setTimeout(() => checkWinCondition(newCapturedCount, newTigers, newGoats, playerType as 'tiger' | 'goat'), 50);
      } else {
        setSelectedPiece(null);
        playSound('invalid');
      }
    }
  }, [currentTurn, goatsToPlace, selectedPiece, isOccupied, getValidMoves, goatsCaptured, goats, tigers, gameOver, checkWinCondition, isAITurn, isAIThinking, playSound]);

  const handlePieceSelect = useCallback((piece: Piece) => {
    if (gameOver || isAIThinking) return;
    if (isAITurn()) return;
    if (piece.type !== currentTurn) return;
    if (currentTurn === 'goat' && goatsToPlace > 0) return;
    
    const isDeselecting = selectedPiece?.position.row === piece.position.row && selectedPiece?.position.col === piece.position.col;
    
    if (!isDeselecting) {
      playSound('select');
    }
    
    setSelectedPiece(prev => 
      prev?.position.row === piece.position.row && prev?.position.col === piece.position.col
        ? null
        : piece
    );
  }, [currentTurn, goatsToPlace, gameOver, isAITurn, isAIThinking, selectedPiece, playSound]);

  const resetGame = useCallback(() => {
    setTigers(INITIAL_TIGERS);
    setGoats([]);
    setGoatsToPlace(20);
    setGoatsCaptured(0);
    setCurrentTurn('goat');
    setSelectedPiece(null);
    setGameOver(null);
    setIsAIThinking(false);
  }, []);

  const tigersTrapped = tigers.filter(tiger => getValidMoves(tiger).length === 0).length;

  return {
    tigers,
    goats,
    goatsToPlace,
    goatsCaptured,
    tigersTrapped,
    currentTurn,
    selectedPiece,
    gameMode,
    difficulty,
    gameOver,
    isAIThinking,
    soundEnabled,
    validMoves: selectedPiece ? getValidMoves(selectedPiece) : [],
    handleNodeClick,
    handlePieceSelect,
    setGameMode,
    setDifficulty,
    setSoundEnabled,
    resetGame,
    // Expose setters for LAN multiplayer sync
    setTigers,
    setGoats,
    setGoatsToPlace,
    setGoatsCaptured,
    setCurrentTurn,
    setGameOver,
  };
}
