import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { GameBoard } from '@/components/game/GameBoard';
import { GameStats } from '@/components/game/GameStats';
import { GameSidebar } from '@/components/game/GameSidebar';
import { RulesModal } from '@/components/game/RulesModal';
import { LANGameModal } from '@/components/game/LANGameModal';
import { ConnectionStatus } from '@/components/game/ConnectionStatus';
import { GameChat } from '@/components/game/GameChat';
import { RematchDialog } from '@/components/game/RematchDialog';
import WelcomeScreen from '@/components/game/WelcomeScreen';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLANMultiplayer, GameState, PlayerRole, TimerSettings, MoveAnimation } from '@/hooks/useLANMultiplayer';
import { useTurnTimer } from '@/hooks/useTurnTimer';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Menu, RotateCcw } from 'lucide-react';
import tigerIcon from '@/assets/tiger-icon.png';
import goatIcon from '@/assets/goat-icon.png';

const Index = () => {
  const isMobile = useIsMobile();
  const [showWelcome, setShowWelcome] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [lanModalOpen, setLanModalOpen] = useState(false);
  const [lanPlayerRole, setLanPlayerRole] = useState<PlayerRole | null>(null);
  const [lastMoveAnimation, setLastMoveAnimation] = useState<MoveAnimation | null>(null);
  const justMadeMove = useRef(false);

  const {
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
    validMoves,
    handleNodeClick,
    handlePieceSelect,
    setGameMode,
    setDifficulty,
    setSoundEnabled,
    resetGame,
    setTigers,
    setGoats,
    setGoatsToPlace,
    setGoatsCaptured,
    setCurrentTurn,
    setGameOver,
  } = useGameLogic();

  const {
    connectionState,
    roomCode,
    error: lanError,
    isHost,
    playerRole,
    playerName,
    opponentName,
    chatMessages,
    timerSettings,
    timerValue,
    matchScore,
    rematchRequested,
    rematchRequestedBy,
    spectators,
    lastMove,
    createRoom,
    joinRoom,
    sendGameState,
    sendChatMessage,
    requestRematch,
    respondToRematch,
    syncTimer,
    disconnect,
    onReceiveGameState,
  } = useLANMultiplayer();

  const isLANMode = connectionState === 'connected';
  const effectiveRole = lanPlayerRole || playerRole;
  const isMyTurn = isLANMode && effectiveRole === currentTurn;
  const isSpectator = effectiveRole === 'spectator';

  // Turn timer
  const handleTimeUp = useCallback(() => {
    // Skip turn when time runs out
    if (isMyTurn && !gameOver) {
      setCurrentTurn(prev => prev === 'tiger' ? 'goat' : 'tiger');
    }
  }, [isMyTurn, gameOver, setCurrentTurn]);

  const { timeLeft, isLow: timerIsLow, resetTimer } = useTurnTimer({
    enabled: timerSettings.enabled,
    seconds: timerSettings.seconds,
    currentTurn,
    gameOver,
    isConnected: isLANMode,
    isHost,
    onTimeUp: handleTimeUp,
    onSync: syncTimer,
  });

  // Handle receiving game state from opponent
  const handleReceiveGameState = useCallback((state: GameState) => {
    setTigers(state.tigers);
    setGoats(state.goats);
    setGoatsToPlace(state.goatsToPlace);
    setGoatsCaptured(state.goatsCaptured);
    setCurrentTurn(state.currentTurn);
    
    if (state.gameOver) {
      setGameOver(state.gameOver);
    }
    
    // Set joiner's role from host's state
    if (state.hostRole && !isHost && !isSpectator) {
      setLanPlayerRole(state.hostRole === 'tiger' ? 'goat' : 'tiger');
    }
    
    // Handle move animation
    if (state.lastMove) {
      setLastMoveAnimation(state.lastMove);
      setTimeout(() => setLastMoveAnimation(null), 400);
    }
  }, [setTigers, setGoats, setGoatsToPlace, setGoatsCaptured, setCurrentTurn, setGameOver, isHost, isSpectator]);

  // Set up game state receiver
  useEffect(() => {
    onReceiveGameState(handleReceiveGameState);
  }, [onReceiveGameState, handleReceiveGameState]);

  // Track previous positions for move detection
  const prevPositionsRef = useRef({ tigers, goats });
  
  // Send game state after each move in LAN mode
  useEffect(() => {
    // Only send if we just made a move (flag was set by wrappedHandleNodeClick)
    if (!isLANMode || !justMadeMove.current || isSpectator) {
      // Update prev positions even if we don't send
      prevPositionsRef.current = { tigers: [...tigers], goats: [...goats] };
      return;
    }
    
    console.log('[LAN] Sending game state after move, currentTurn:', currentTurn);
    
    // Detect the move that was made
    let moveAnimation: MoveAnimation | undefined;
    const prevPositions = prevPositionsRef.current;
    
    // Check for tiger move
    const movedTiger = tigers.find((t, i) => {
      const prev = prevPositions.tigers[i];
      return prev && (t.position.row !== prev.position.row || t.position.col !== prev.position.col);
    });
    
    if (movedTiger) {
      const prevTiger = prevPositions.tigers.find(pt => 
        !tigers.some(t => t.position.row === pt.position.row && t.position.col === pt.position.col)
      );
      if (prevTiger) {
        // Check for capture
        const rowDiff = Math.abs(movedTiger.position.row - prevTiger.position.row);
        const colDiff = Math.abs(movedTiger.position.col - prevTiger.position.col);
        let capturedAt: { row: number; col: number } | undefined;
        
        if (rowDiff === 2 || colDiff === 2) {
          capturedAt = {
            row: (movedTiger.position.row + prevTiger.position.row) / 2,
            col: (movedTiger.position.col + prevTiger.position.col) / 2,
          };
        }
        
        moveAnimation = {
          pieceType: 'tiger',
          from: prevTiger.position,
          to: movedTiger.position,
          capturedAt,
        };
      }
    } else {
      // Check for goat move or placement
      const movedGoat = goats.find((g, i) => {
        if (i >= prevPositions.goats.length) return false; // New goat placed
        const prev = prevPositions.goats[i];
        return prev && (g.position.row !== prev.position.row || g.position.col !== prev.position.col);
      });
      
      if (movedGoat) {
        const prevGoat = prevPositions.goats.find(pg => 
          !goats.some(g => g.position.row === pg.position.row && g.position.col === pg.position.col)
        );
        if (prevGoat) {
          moveAnimation = {
            pieceType: 'goat',
            from: prevGoat.position,
            to: movedGoat.position,
          };
        }
      } else if (goats.length > prevPositions.goats.length) {
        // New goat placed
        const newGoat = goats[goats.length - 1];
        moveAnimation = {
          pieceType: 'goat',
          from: newGoat.position, // Same position for placement
          to: newGoat.position,
        };
      }
    }
    
    sendGameState({
      tigers,
      goats,
      goatsToPlace,
      goatsCaptured,
      currentTurn,
      gameOver,
      hostRole: isHost ? lanPlayerRole : undefined,
      lastMove: moveAnimation,
      timerSettings,
      matchScore,
      spectators,
    });
    
    // Reset the flag and update prev positions
    justMadeMove.current = false;
    prevPositionsRef.current = { tigers: [...tigers], goats: [...goats] };
  }, [isLANMode, tigers, goats, goatsToPlace, goatsCaptured, currentTurn, gameOver, sendGameState, isHost, lanPlayerRole, timerSettings, matchScore, spectators, isSpectator]);

  // Handle creating LAN room
  const handleCreateRoom = useCallback((role: PlayerRole, name: string, timer: TimerSettings) => {
    setLanPlayerRole(role);
    createRoom(role, name, timer);
    resetGame();
  }, [createRoom, resetGame]);

  // Handle joining LAN room
  const handleJoinRoom = useCallback((code: string, name: string, asSpectator?: boolean) => {
    joinRoom(code, name, asSpectator);
  }, [joinRoom]);

  // Send initial state when connected as host
  useEffect(() => {
    if (connectionState === 'connected' && isHost && lanPlayerRole) {
      sendGameState({
        tigers,
        goats,
        goatsToPlace,
        goatsCaptured,
        currentTurn,
        gameOver,
        hostRole: lanPlayerRole,
        timerSettings,
        matchScore,
        spectators,
      });
    }
  }, [connectionState, isHost, lanPlayerRole]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
    setLanPlayerRole(null);
    setLanModalOpen(false);
  }, [disconnect]);

  // Handle rematch accept
  const handleRematchAccept = useCallback(() => {
    respondToRematch(true);
    // Swap roles
    if (lanPlayerRole && lanPlayerRole !== 'spectator') {
      setLanPlayerRole(lanPlayerRole === 'tiger' ? 'goat' : 'tiger');
    }
    resetGame();
    resetTimer();
  }, [respondToRematch, lanPlayerRole, resetGame, resetTimer]);

  // Handle rematch decline
  const handleRematchDecline = useCallback(() => {
    respondToRematch(false);
  }, [respondToRematch]);

  // Wrap handlers to check if it's player's turn in LAN mode
  const wrappedHandleNodeClick = useCallback((row: number, col: number) => {
    if (isLANMode && (!isMyTurn || isSpectator)) return;
    // Mark that we're making a move so the sync effect knows to send state
    justMadeMove.current = true;
    handleNodeClick(row, col);
  }, [isLANMode, isMyTurn, isSpectator, handleNodeClick]);

  const wrappedHandlePieceSelect = useCallback((piece: any) => {
    if (isLANMode && (!isMyTurn || isSpectator)) return;
    handlePieceSelect(piece);
  }, [isLANMode, isMyTurn, isSpectator, handlePieceSelect]);

  // Handle welcome screen mode selection
  const handleWelcomeModeSelect = useCallback((mode: 'ai' | 'local' | 'online') => {
    setShowWelcome(false);
    if (mode === 'ai') {
      setGameMode('vs-computer');
    } else if (mode === 'local') {
      setGameMode('pvp');
    } else if (mode === 'online') {
      setLanModalOpen(true);
    }
    resetGame();
  }, [setGameMode, resetGame]);

  return (
    <>
      {/* Welcome Screen for first-time/mobile users */}
      {showWelcome && (
        <WelcomeScreen
          onSelectMode={handleWelcomeModeSelect}
          onClose={() => setShowWelcome(false)}
        />
      )}
      
      <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <GameSidebar 
          currentMode={gameMode}
          currentDifficulty={difficulty}
          soundEnabled={soundEnabled}
          isLANMode={isLANMode}
          onSelectMode={setGameMode}
          onSelectDifficulty={setDifficulty}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onNewGame={resetGame}
          onOpenRules={() => setRulesOpen(true)}
          onOpenLAN={() => setLanModalOpen(true)}
        />
        
        <main className="flex-1 p-2 sm:p-4 md:p-8 overflow-x-hidden">
          {/* Header with sidebar trigger */}
          <header className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
            <SidebarTrigger className="p-1.5 sm:p-2">
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </SidebarTrigger>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-display text-gradient tracking-wider truncate">
                Bagchal
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">
                Tiger & Goat - Ancient Nepali Board Game
              </p>
            </div>
          </header>

          {/* LAN Connection Status */}
          {isLANMode && (
            <div className="mb-4 max-w-md mx-auto">
              <ConnectionStatus
                connectionState={connectionState}
                playerRole={effectiveRole}
                isMyTurn={isMyTurn}
                onDisconnect={handleDisconnect}
                playerName={playerName}
                opponentName={opponentName}
                timerEnabled={timerSettings.enabled}
                timerValue={timeLeft}
                timerIsLow={timerIsLow}
                matchScore={matchScore}
                spectatorCount={spectators.length}
                isHost={isHost}
              />
            </div>
          )}

          {/* Main Content - Responsive Layout */}
          <div className="flex flex-col xl:flex-row gap-3 sm:gap-6 lg:gap-8 items-center xl:items-start justify-center">
            {/* Game Board Area */}
            <div className="flex flex-col items-center gap-2 sm:gap-4 animate-scale-in w-full xl:w-auto">
              {/* Turn Indicator - Compact on mobile */}
              <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl card-gradient shadow-card w-full max-w-md justify-center">
                <span className="text-muted-foreground text-xs sm:text-sm">Turn:</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <img 
                    src={currentTurn === 'tiger' ? tigerIcon : goatIcon} 
                    alt={currentTurn}
                    className="w-6 h-6 sm:w-10 sm:h-10 animate-float object-contain"
                  />
                  <span className="font-display text-sm sm:text-xl text-primary uppercase">
                    {currentTurn === 'tiger' ? 'Tiger' : 'Goat'}
                  </span>
                </div>
              {goatsToPlace > 0 && currentTurn === 'goat' && !isAIThinking && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  (Place a goat)
                </span>
              )}
              {isLANMode && !isMyTurn && !isSpectator ? (
                <span className="text-xs sm:text-sm text-primary animate-pulse">
                  {opponentName || 'Opponent'} thinking...
                </span>
              ) : isAIThinking ? (
                <span className="text-xs sm:text-sm text-primary animate-pulse">
                  Opponent thinking...
                </span>
              ) : null}
            </div>

              {/* Game Board */}
              <GameBoard
                tigers={tigers}
                goats={goats}
                goatsToPlace={goatsToPlace}
                currentTurn={currentTurn}
                selectedPiece={selectedPiece}
                onNodeClick={wrappedHandleNodeClick}
                onPieceSelect={wrappedHandlePieceSelect}
                validMoves={validMoves}
                isAIThinking={isAIThinking || (isLANMode && !isMyTurn && !isSpectator)}
                lastMove={lastMoveAnimation || lastMove}
              />

              {/* Game Over Message */}
              {gameOver && (
                <div className="mt-2 sm:mt-4 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-primary/20 border border-primary animate-scale-in w-full max-w-md">
                  <p className="text-base sm:text-xl font-display text-primary text-center">{gameOver}</p>
                  {isLANMode && !isSpectator ? (
                    <Button 
                      variant="game" 
                      size="default" 
                      className="w-full mt-3 sm:mt-4 text-sm sm:text-base gap-2"
                      onClick={requestRematch}
                      disabled={rematchRequested}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {rematchRequested ? 'Waiting for response...' : 'Request Rematch'}
                    </Button>
                  ) : !isSpectator && (
                    <Button 
                      variant="game" 
                      size="default" 
                      className="w-full mt-3 sm:mt-4 text-sm sm:text-base"
                      onClick={resetGame}
                    >
                      Play Again
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Stats Panel - Below board on mobile, side on desktop */}
            <div className="w-full max-w-md xl:w-64 animate-fade-in">
              <GameStats
                goatsAvailable={goatsToPlace}
                goatsOnBoard={goats.length}
                goatsCaptured={goatsCaptured}
                tigersTrapped={tigersTrapped}
                currentTurn={currentTurn}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-6 sm:mt-12 text-center text-muted-foreground text-xs sm:text-sm">
            <p>© 2024 Bagchal. A modern take on the classic Nepali board game.</p>
          </footer>
        </main>

        {/* Rules Modal */}
        <RulesModal open={rulesOpen} onOpenChange={setRulesOpen} />

        {/* LAN Game Modal */}
        <LANGameModal
          open={lanModalOpen}
          onOpenChange={setLanModalOpen}
          connectionState={connectionState}
          roomCode={roomCode}
          error={lanError}
          isHost={isHost}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onDisconnect={handleDisconnect}
        />

        {/* Game Chat (LAN mode only) */}
        {isLANMode && (
          <GameChat
            messages={chatMessages}
            onSendMessage={sendChatMessage}
            playerName={playerName}
            disabled={false}
          />
        )}

        {/* Rematch Dialog */}
        <RematchDialog
          open={rematchRequested}
          requestedBy={rematchRequestedBy}
          isHost={isHost}
          playerName={playerName}
          opponentName={opponentName}
          onAccept={handleRematchAccept}
          onDecline={handleRematchDecline}
        />
      </div>
    </SidebarProvider>
    </>
  );
};

export default Index;
