import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Piece, Position } from './useGameLogic';

export type ConnectionState = 'idle' | 'creating' | 'waiting' | 'joining' | 'connected' | 'disconnected';
export type PlayerRole = 'tiger' | 'goat' | 'spectator';

export interface PlayerInfo {
  name: string;
  role: PlayerRole;
}

export interface MoveAnimation {
  pieceType: 'tiger' | 'goat';
  from: Position;
  to: Position;
  capturedAt?: Position;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isEmoji?: boolean;
}

export interface TimerSettings {
  enabled: boolean;
  seconds: number; // 15, 30, 60, or 0 for unlimited
}

export interface MatchScore {
  host: number;
  guest: number;
}

export interface GameState {
  tigers: Piece[];
  goats: Piece[];
  goatsToPlace: number;
  goatsCaptured: number;
  currentTurn: 'tiger' | 'goat';
  gameOver: string | null;
  hostRole?: PlayerRole;
  hostPlayer?: PlayerInfo;
  guestPlayer?: PlayerInfo;
  lastMove?: MoveAnimation;
  timerSettings?: TimerSettings;
  timerValue?: number;
  matchScore?: MatchScore;
  spectators?: string[];
}

export type MessageType = 'game_state' | 'chat' | 'rematch_request' | 'rematch_response' | 'timer_sync' | 'player_info' | 'spectator_join';

export interface PeerMessage {
  type: MessageType;
  payload: any;
}

interface LANMultiplayerReturn {
  connectionState: ConnectionState;
  playerRole: PlayerRole | null;
  roomCode: string;
  error: string | null;
  isHost: boolean;
  playerName: string;
  opponentName: string;
  chatMessages: ChatMessage[];
  timerSettings: TimerSettings;
  timerValue: number;
  matchScore: MatchScore;
  rematchRequested: boolean;
  rematchRequestedBy: 'host' | 'guest' | null;
  spectators: string[];
  lastMove: MoveAnimation | null;
  createRoom: (role: PlayerRole, name: string, timer: TimerSettings) => void;
  joinRoom: (code: string, name: string, asSpectator?: boolean) => void;
  sendGameState: (state: GameState) => void;
  sendChatMessage: (text: string, isEmoji?: boolean) => void;
  requestRematch: () => void;
  respondToRematch: (accept: boolean) => void;
  syncTimer: (value: number) => void;
  disconnect: () => void;
  onReceiveGameState: (callback: (state: GameState) => void) => void;
  setPlayerName: (name: string) => void;
}

const generateRoomCode = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const generateMessageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function useLANMultiplayer(): LANMultiplayerReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({ enabled: false, seconds: 30 });
  const [timerValue, setTimerValue] = useState(30);
  const [matchScore, setMatchScore] = useState<MatchScore>({ host: 0, guest: 0 });
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchRequestedBy, setRematchRequestedBy] = useState<'host' | 'guest' | null>(null);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<MoveAnimation | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const spectatorConnectionsRef = useRef<DataConnection[]>([]);
  const gameStateCallbackRef = useRef<((state: GameState) => void) | null>(null);
  const playerRoleRef = useRef<PlayerRole | null>(null);
  const playerNameRef = useRef('');
  const timerSettingsRef = useRef<TimerSettings>({ enabled: false, seconds: 30 });
  
  // Keep refs in sync with state
  useEffect(() => {
    playerRoleRef.current = playerRole;
  }, [playerRole]);
  
  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);
  
  useEffect(() => {
    timerSettingsRef.current = timerSettings;
  }, [timerSettings]);

  const cleanup = useCallback(() => {
    spectatorConnectionsRef.current.forEach(conn => conn.close());
    spectatorConnectionsRef.current = [];
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: PeerMessage) => {
    console.log('[LAN] sendMessage called, type:', message.type, 'connection open:', connectionRef.current?.open);
    
    if (connectionRef.current && connectionRef.current.open) {
      console.log('[LAN] Sending message via main connection:', message.type);
      connectionRef.current.send(message);
    } else {
      console.warn('[LAN] Main connection not ready, message not sent:', message.type);
    }
    
    // Also send to spectators if host
    spectatorConnectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }, []);

  // Use a ref to track isHost since it may not be updated when handleMessage is called
  const isHostRef = useRef(false);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const handleMessage = useCallback((data: PeerMessage, fromSpectator = false) => {
    console.log('[LAN] Received message:', data.type, 'isHost:', isHostRef.current);
    
    switch (data.type) {
      case 'game_state':
        console.log('[LAN] Game state received, currentTurn:', data.payload.currentTurn);
        if (data.payload.lastMove) {
          setLastMove(data.payload.lastMove);
          setTimeout(() => setLastMove(null), 400);
        }
        if (gameStateCallbackRef.current) {
          gameStateCallbackRef.current(data.payload);
        }
        break;
      case 'chat':
        setChatMessages(prev => [...prev, data.payload as ChatMessage]);
        break;
      case 'rematch_request':
        setRematchRequested(true);
        setRematchRequestedBy(data.payload.from);
        break;
      case 'rematch_response':
        if (data.payload.accepted) {
          setRematchRequested(false);
          setRematchRequestedBy(null);
        } else {
          setRematchRequested(false);
          setRematchRequestedBy(null);
        }
        break;
      case 'timer_sync':
        setTimerValue(data.payload.value);
        break;
      case 'player_info':
        console.log('[LAN] Received player_info:', data.payload);
        setOpponentName(data.payload.name);
        if (!fromSpectator && data.payload.timerSettings) {
          setTimerSettings(data.payload.timerSettings);
          setTimerValue(data.payload.timerSettings.seconds);
        }
        // Set guest's role based on host's role (only for non-host, non-spectator)
        if (!fromSpectator && data.payload.hostRole && !isHostRef.current) {
          const guestRole = data.payload.hostRole === 'tiger' ? 'goat' : 'tiger';
          console.log('[LAN] Setting guest role to:', guestRole, 'because hostRole is:', data.payload.hostRole);
          setPlayerRole(guestRole);
        }
        break;
      case 'spectator_join':
        if (!fromSpectator) {
          setSpectators(prev => [...prev, data.payload.name]);
        }
        break;
    }
  }, []);

  const setupConnection = useCallback((conn: DataConnection, isSpectatorConn = false) => {
    // Set connection ref BEFORE setting up event handlers
    if (isSpectatorConn) {
      spectatorConnectionsRef.current.push(conn);
    } else {
      connectionRef.current = conn;
    }

    // Add ICE connection state monitoring for debugging
    const peerConnection = (conn as any).peerConnection as RTCPeerConnection | undefined;
    if (peerConnection) {
      peerConnection.oniceconnectionstatechange = () => {
        console.log('[LAN] ICE connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
          console.error('[LAN] ICE connection failed - may need better TURN server');
          if (!isSpectatorConn) {
            setError('Connection failed - network may be blocking peer connections');
          }
        }
      };
      peerConnection.onicegatheringstatechange = () => {
        console.log('[LAN] ICE gathering state:', peerConnection.iceGatheringState);
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[LAN] ICE candidate:', event.candidate.type, event.candidate.address);
        }
      };
    }

    conn.on('open', () => {
      console.log('[LAN] Connection opened, isHost:', isHostRef.current, 'playerRole:', playerRoleRef.current);
      if (!isSpectatorConn) {
        setConnectionState('connected');
        setError(null);
        // Send player info directly through the connection (not via sendMessage which may have stale ref)
        const playerInfoMessage: PeerMessage = {
          type: 'player_info',
          payload: { 
            name: playerNameRef.current, 
            timerSettings: timerSettingsRef.current, 
            hostRole: playerRoleRef.current 
          }
        };
        console.log('[LAN] Sending player_info:', playerInfoMessage.payload);
        conn.send(playerInfoMessage);
      }
    });

    conn.on('data', (data) => {
      try {
        console.log('[LAN] Raw data received:', data);
        handleMessage(data as PeerMessage, isSpectatorConn);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    conn.on('close', () => {
      console.log('[LAN] Connection closed');
      if (!isSpectatorConn) {
        setConnectionState('disconnected');
      } else {
        spectatorConnectionsRef.current = spectatorConnectionsRef.current.filter(c => c !== conn);
        setSpectators(prev => prev.slice(0, -1));
      }
    });

    conn.on('error', (err) => {
      console.error('[LAN] Connection error:', err);
      if (!isSpectatorConn) {
        setError('Connection error: ' + err.message);
        setConnectionState('disconnected');
      }
    });
  }, [handleMessage]);

  const createRoom = useCallback((role: PlayerRole, name: string, timer: TimerSettings) => {
    cleanup();
    setError(null);
    setConnectionState('creating');
    
    // Set refs BEFORE creating peer (so they're available when connection opens)
    isHostRef.current = true;
    playerRoleRef.current = role;
    playerNameRef.current = name;
    timerSettingsRef.current = timer;
    
    setIsHost(true);
    setPlayerRole(role);
    setPlayerName(name);
    setTimerSettings(timer);
    setTimerValue(timer.seconds);
    setChatMessages([]);
    setMatchScore({ host: 0, guest: 0 });
    setSpectators([]);

    const code = generateRoomCode();
    const peerId = `bagchal-${code}`;

    console.log('[LAN] Creating room with peerId:', peerId);

    // Use PeerJS cloud with STUN + free TURN servers for cross-network connectivity
    const peer = new Peer(peerId, {
      debug: 3, // Max debug for troubleshooting
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.relay.metered.ca:80' },
          // Metered.ca free TURN servers (more reliable)
          {
            urls: 'turn:global.relay.metered.ca:80',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          },
          {
            urls: 'turn:global.relay.metered.ca:80?transport=tcp',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          },
          {
            urls: 'turn:global.relay.metered.ca:443',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          },
          {
            urls: 'turns:global.relay.metered.ca:443?transport=tcp',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          }
        ],
        iceCandidatePoolSize: 10
      }
    });
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('[LAN] Host peer opened with ID:', id);
      setRoomCode(code);
      setConnectionState('waiting');
    });

    peer.on('connection', (conn) => {
      console.log('[LAN] Incoming connection from:', conn.peer);
      // Check if it's a spectator (metadata would indicate)
      const isSpectator = conn.metadata?.spectator === true;
      setupConnection(conn, isSpectator);
      
      if (isSpectator) {
        // Handle spectator connection
        conn.on('open', () => {
          conn.send({
            type: 'player_info',
            payload: { name, timerSettings: timer, isHost: true }
          });
        });
      }
    });

    peer.on('error', (err) => {
      console.error('[LAN] Peer error:', err.type, err.message);
      if (err.type === 'unavailable-id') {
        setError('Room code in use, please try again');
        setConnectionState('idle');
      } else if (err.type === 'network') {
        setError('Network error - check your internet connection');
        setConnectionState('idle');
      } else if (err.type === 'server-error') {
        setError('Server error - please try again');
        setConnectionState('idle');
      } else {
        setError(`Failed to create room: ${err.type}`);
        setConnectionState('idle');
      }
    });

    peer.on('disconnected', () => {
      console.log('[LAN] Peer disconnected from server, attempting reconnect...');
      peer.reconnect();
    });
  }, [cleanup, setupConnection]);

  const joinRoom = useCallback((code: string, name: string, asSpectator = false) => {
    cleanup();
    setError(null);
    setConnectionState('joining');
    
    // Set refs BEFORE creating peer
    isHostRef.current = false;
    playerNameRef.current = name;
    
    setIsHost(false);
    setPlayerName(name);
    setChatMessages([]);

    if (asSpectator) {
      setPlayerRole('spectator');
      playerRoleRef.current = 'spectator';
    }

    const hostPeerId = `bagchal-${code}`;
    console.log('[LAN] Joining room, connecting to:', hostPeerId);

    // Use PeerJS cloud with STUN + free TURN servers for cross-network connectivity
    const peer = new Peer({
      debug: 3, // Max debug for troubleshooting
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.relay.metered.ca:80' },
          // Metered.ca free TURN servers (more reliable)
          {
            urls: 'turn:global.relay.metered.ca:80',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          },
          {
            urls: 'turn:global.relay.metered.ca:80?transport=tcp',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          },
          {
            urls: 'turn:global.relay.metered.ca:443',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          },
          {
            urls: 'turns:global.relay.metered.ca:443?transport=tcp',
            username: 'e8dd65b92f6a1f3b2a3c5d6e',
            credential: 'kW+5X8Qz3Y1B2C4D'
          }
        ],
        iceCandidatePoolSize: 10
      }
    });
    peerRef.current = peer;

    peer.on('open', (myId) => {
      console.log('[LAN] Joiner peer opened with ID:', myId, 'connecting to:', hostPeerId);
      const conn = peer.connect(hostPeerId, { 
        reliable: true,
        metadata: { spectator: asSpectator }
      });
      
      // Set up connection handlers first
      setupConnection(conn, asSpectator);
      
      // The player_info will be sent in setupConnection's conn.on('open') handler
    });

    peer.on('error', (err) => {
      console.error('[LAN] Peer error:', err.type, err.message);
      if (err.type === 'peer-unavailable') {
        setError('Room not found - check the code and try again');
      } else if (err.type === 'network') {
        setError('Network error - check your internet connection');
      } else if (err.type === 'server-error') {
        setError('Server error - please try again');
      } else {
        setError(`Failed to join room: ${err.type}`);
      }
      setConnectionState('idle');
    });

    peer.on('disconnected', () => {
      console.log('[LAN] Peer disconnected from server');
    });
  }, [cleanup, setupConnection]);

  const sendGameState = useCallback((state: GameState) => {
    sendMessage({ type: 'game_state', payload: state });
  }, [sendMessage]);

  const sendChatMessage = useCallback((text: string, isEmoji = false) => {
    const message: ChatMessage = {
      id: generateMessageId(),
      sender: playerName,
      text,
      timestamp: Date.now(),
      isEmoji
    };
    setChatMessages(prev => [...prev, message]);
    sendMessage({ type: 'chat', payload: message });
  }, [sendMessage, playerName]);

  const requestRematch = useCallback(() => {
    setRematchRequested(true);
    setRematchRequestedBy(isHost ? 'host' : 'guest');
    sendMessage({ 
      type: 'rematch_request', 
      payload: { from: isHost ? 'host' : 'guest' } 
    });
  }, [sendMessage, isHost]);

  const respondToRematch = useCallback((accept: boolean) => {
    sendMessage({ type: 'rematch_response', payload: { accepted: accept } });
    if (accept) {
      setRematchRequested(false);
      setRematchRequestedBy(null);
    } else {
      setRematchRequested(false);
      setRematchRequestedBy(null);
    }
  }, [sendMessage]);

  const syncTimer = useCallback((value: number) => {
    setTimerValue(value);
    sendMessage({ type: 'timer_sync', payload: { value } });
  }, [sendMessage]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState('idle');
    setPlayerRole(null);
    setRoomCode('');
    setError(null);
    setIsHost(false);
    setPlayerName('');
    setOpponentName('');
    setChatMessages([]);
    setMatchScore({ host: 0, guest: 0 });
    setRematchRequested(false);
    setRematchRequestedBy(null);
    setSpectators([]);
    setLastMove(null);
  }, [cleanup]);

  const onReceiveGameState = useCallback((callback: (state: GameState) => void) => {
    gameStateCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    playerRole,
    roomCode,
    error,
    isHost,
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
    setPlayerName,
  };
}
