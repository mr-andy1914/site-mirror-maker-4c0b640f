import { useCallback } from 'react';

export type Position = { row: number; col: number };
export type Piece = { type: 'tiger' | 'goat'; position: Position };
export type AIDifficulty = 'easy' | 'medium' | 'hard';

// Check if diagonal movement is valid
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

export function useGameAI(difficulty: AIDifficulty = 'medium') {
  const isOccupied = useCallback((row: number, col: number, tigers: Piece[], goats: Piece[]) => {
    return tigers.some(t => t.position.row === row && t.position.col === col) ||
           goats.some(g => g.position.row === row && g.position.col === col);
  }, []);

  const isOccupiedByGoat = useCallback((row: number, col: number, goats: Piece[]) => {
    return goats.some(g => g.position.row === row && g.position.col === col);
  }, []);

  const getValidMoves = useCallback((piece: Piece, tigers: Piece[], goats: Piece[]): Position[] => {
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
      
      if (!isOccupied(newRow, newCol, tigers, goats)) {
        moves.push({ row: newRow, col: newCol });
      }
      
      // Tiger can jump
      if (piece.type === 'tiger') {
        const jumpRow = row + dr * 2;
        const jumpCol = col + dc * 2;
        
        if (isValidPosition(jumpRow, jumpCol)) {
          const midRow = row + dr;
          const midCol = col + dc;
          
          const hasGoatToCapture = isOccupiedByGoat(midRow, midCol, goats);
          
          if (hasGoatToCapture && !isOccupied(jumpRow, jumpCol, tigers, goats)) {
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
  }, [isOccupied, isOccupiedByGoat]);

  // Add randomness based on difficulty
  const shouldMakeSuboptimalMove = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return Math.random() < 0.5; // 50% chance of suboptimal move
      case 'medium':
        return Math.random() < 0.2; // 20% chance of suboptimal move
      case 'hard':
        return false; // Always optimal
    }
  }, [difficulty]);

  // Get depth for lookahead based on difficulty
  const getLookaheadDepth = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return 0; // No lookahead
      case 'medium':
        return 1; // 1 move ahead
      case 'hard':
        return 2; // 2 moves ahead
    }
  }, [difficulty]);

  // AI move for Tiger - prioritize captures, then strategic positions
  const getTigerAIMove = useCallback((tigers: Piece[], goats: Piece[]): { tiger: Piece; to: Position } | null => {
    const allMoves: { tiger: Piece; to: Position; score: number }[] = [];
    const depth = getLookaheadDepth();
    
    for (const tiger of tigers) {
      const moves = getValidMoves(tiger, tigers, goats);
      
      for (const move of moves) {
        let score = 0;
        const { row: fromRow, col: fromCol } = tiger.position;
        const rowDiff = Math.abs(move.row - fromRow);
        const colDiff = Math.abs(move.col - fromCol);
        
        // Capture move - highest priority
        if (rowDiff === 2 || colDiff === 2) {
          score = 100;
          
          // Hard mode: consider double capture potential
          if (depth >= 2) {
            const midRow = (move.row + fromRow) / 2;
            const midCol = (move.col + fromCol) / 2;
            const newGoats = goats.filter(g => !(g.position.row === midRow && g.position.col === midCol));
            const tempTiger = { ...tiger, position: move };
            const tempTigers = tigers.map(t => t === tiger ? tempTiger : t);
            const futureMoves = getValidMoves(tempTiger, tempTigers, newGoats);
            for (const fm of futureMoves) {
              const frd = Math.abs(fm.row - move.row);
              const fcd = Math.abs(fm.col - move.col);
              if (frd === 2 || fcd === 2) {
                score += 50; // Can capture again!
                break;
              }
            }
          }
        } else {
          // Prefer center positions
          const centerDist = Math.abs(move.row - 2) + Math.abs(move.col - 2);
          score = 10 - centerDist;
          
          // Check if this move threatens a capture next turn
          if (depth >= 1) {
            const tempTiger = { ...tiger, position: move };
            const tempTigers = tigers.map(t => t === tiger ? tempTiger : t);
            const futureMoves = getValidMoves(tempTiger, tempTigers, goats);
            for (const fm of futureMoves) {
              const frd = Math.abs(fm.row - move.row);
              const fcd = Math.abs(fm.col - move.col);
              if (frd === 2 || fcd === 2) {
                score += 25; // Threatens capture
                break;
              }
            }
          }
          
          // Hard mode: avoid getting trapped
          if (depth >= 2) {
            const tempTiger = { ...tiger, position: move };
            const tempTigers = tigers.map(t => t === tiger ? tempTiger : t);
            const futureMoves = getValidMoves(tempTiger, tempTigers, goats);
            if (futureMoves.length <= 1) {
              score -= 15; // Risky position
            }
          }
        }
        
        allMoves.push({ tiger, to: move, score });
      }
    }
    
    if (allMoves.length === 0) return null;
    
    // Sort by score
    allMoves.sort((a, b) => b.score - a.score);
    
    // Add randomness for easier difficulties
    if (shouldMakeSuboptimalMove() && allMoves.length > 1) {
      const randomIndex = Math.floor(Math.random() * Math.min(allMoves.length, 3));
      return { tiger: allMoves[randomIndex].tiger, to: allMoves[randomIndex].to };
    }
    
    return { tiger: allMoves[0].tiger, to: allMoves[0].to };
  }, [getValidMoves, getLookaheadDepth, shouldMakeSuboptimalMove]);

  // AI placement for Goat - try to block tigers and form defensive lines
  const getGoatAIPlacement = useCallback((tigers: Piece[], goats: Piece[]): Position | null => {
    const emptyPositions: { pos: Position; score: number }[] = [];
    const depth = getLookaheadDepth();
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!isOccupied(row, col, tigers, goats)) {
          let score = 0;
          
          // Prefer center and edges for strategic control
          const centerDist = Math.abs(row - 2) + Math.abs(col - 2);
          score += (4 - centerDist) * 2;
          
          // Check if placing here blocks a tiger capture
          for (const tiger of tigers) {
            const tigerMoves = getValidMoves(tiger, tigers, goats);
            for (const tm of tigerMoves) {
              const rd = Math.abs(tm.row - tiger.position.row);
              const cd = Math.abs(tm.col - tiger.position.col);
              if (rd === 2 || cd === 2) {
                // This is a capture move, check if our position blocks landing
                if (tm.row === row && tm.col === col) {
                  score += 35; // Block capture landing spot
                }
                // Check if we block the middle (the goat being captured)
                const midRow = (tm.row + tiger.position.row) / 2;
                const midCol = (tm.col + tiger.position.col) / 2;
                if (row === midRow && col === midCol) {
                  score += 20; // Block capture path
                }
              }
            }
          }
          
          // Prefer positions adjacent to existing goats (form groups)
          for (const goat of goats) {
            const dist = Math.abs(goat.position.row - row) + Math.abs(goat.position.col - col);
            if (dist === 1) score += 5;
          }
          
          // Hard mode: Consider future trapping potential
          if (depth >= 2) {
            const tempGoats = [...goats, { type: 'goat' as const, position: { row, col } }];
            let tigerMobility = 0;
            for (const tiger of tigers) {
              tigerMobility += getValidMoves(tiger, tigers, tempGoats).length;
            }
            score += (20 - tigerMobility); // Lower tiger mobility is better
          }
          
          // Avoid positions that can be immediately captured
          const tempGoats = [...goats, { type: 'goat' as const, position: { row, col } }];
          for (const tiger of tigers) {
            const tigerMoves = getValidMoves(tiger, tigers, tempGoats);
            for (const tm of tigerMoves) {
              const rd = Math.abs(tm.row - tiger.position.row);
              const cd = Math.abs(tm.col - tiger.position.col);
              if (rd === 2 || cd === 2) {
                const midRow = (tm.row + tiger.position.row) / 2;
                const midCol = (tm.col + tiger.position.col) / 2;
                if (midRow === row && midCol === col) {
                  score -= 40; // Can be captured immediately
                }
              }
            }
          }
          
          emptyPositions.push({ pos: { row, col }, score });
        }
      }
    }
    
    if (emptyPositions.length === 0) return null;
    
    emptyPositions.sort((a, b) => b.score - a.score);
    
    if (shouldMakeSuboptimalMove() && emptyPositions.length > 1) {
      const randomIndex = Math.floor(Math.random() * Math.min(emptyPositions.length, 4));
      return emptyPositions[randomIndex].pos;
    }
    
    return emptyPositions[0].pos;
  }, [isOccupied, getValidMoves, getLookaheadDepth, shouldMakeSuboptimalMove]);

  // AI move for Goat - try to trap tigers
  const getGoatAIMove = useCallback((tigers: Piece[], goats: Piece[]): { goat: Piece; to: Position } | null => {
    const allMoves: { goat: Piece; to: Position; score: number }[] = [];
    const depth = getLookaheadDepth();
    
    for (const goat of goats) {
      const moves = getValidMoves(goat, tigers, goats);
      
      for (const move of moves) {
        let score = 0;
        
        // Simulate this move
        const tempGoat = { ...goat, position: move };
        const tempGoats = goats.map(g => g === goat ? tempGoat : g);
        
        // Check how many tiger moves are blocked
        let tigerMobility = 0;
        let tigersTrapped = 0;
        for (const tiger of tigers) {
          const tigerMoves = getValidMoves(tiger, tigers, tempGoats).length;
          tigerMobility += tigerMoves;
          if (tigerMoves === 0) tigersTrapped++;
        }
        
        // Lower tiger mobility is better
        score = 50 - tigerMobility * 2;
        
        // Bonus for trapping tigers
        score += tigersTrapped * 30;
        
        // Hard mode: deeper analysis
        if (depth >= 2) {
          // Check if this creates a trap potential
          for (const tiger of tigers) {
            const tigerMoves = getValidMoves(tiger, tigers, tempGoats);
            if (tigerMoves.length <= 2) {
              score += 15; // Close to trapping
            }
          }
        }
        
        // Prefer positions that don't get captured
        let canBeCaptured = false;
        for (const tiger of tigers) {
          const tigerMoves = getValidMoves(tiger, tigers, tempGoats);
          for (const tm of tigerMoves) {
            const rd = Math.abs(tm.row - tiger.position.row);
            const cd = Math.abs(tm.col - tiger.position.col);
            if (rd === 2 || cd === 2) {
              const midRow = (tm.row + tiger.position.row) / 2;
              const midCol = (tm.col + tiger.position.col) / 2;
              if (midRow === move.row && midCol === move.col) {
                canBeCaptured = true;
                break;
              }
            }
          }
        }
        
        if (canBeCaptured) score -= 45;
        
        // Prefer center positions
        const centerDist = Math.abs(move.row - 2) + Math.abs(move.col - 2);
        score += (4 - centerDist);
        
        allMoves.push({ goat, to: move, score });
      }
    }
    
    if (allMoves.length === 0) return null;
    
    allMoves.sort((a, b) => b.score - a.score);
    
    if (shouldMakeSuboptimalMove() && allMoves.length > 1) {
      const randomIndex = Math.floor(Math.random() * Math.min(allMoves.length, 3));
      return { goat: allMoves[randomIndex].goat, to: allMoves[randomIndex].to };
    }
    
    return { goat: allMoves[0].goat, to: allMoves[0].to };
  }, [getValidMoves, getLookaheadDepth, shouldMakeSuboptimalMove]);

  return {
    getTigerAIMove,
    getGoatAIPlacement,
    getGoatAIMove,
  };
}
