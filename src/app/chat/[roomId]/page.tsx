'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { playMessageSound, playJoinSound, playKeyClickSound } from '@/lib/audio';

interface Message {
  id: string;
  text: string;
  senderId?: string;
  senderName?: string;
  senderColor?: string;
  timestamp: number;
  system?: boolean;
}

interface RoomUser {
  id: string;
  nickname: string;
  color: string;
  joinedAt: number;
}

const TERMINAL_ACCENTS = [
  { name: 'PHOSPHOR_GREEN', hex: '#00FF66' },
  { name: 'AMBER_CRT', hex: '#FFCC00' },
  { name: 'CYAN_TERMINAL', hex: '#00F0FF' },
  { name: 'RED_ALERT', hex: '#FF3333' },
  { name: 'MATRIX_BRIGHT', hex: '#39FF14' },
];

export default function TerminalChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const router = useRouter();

  // Operator State
  const [nickname, setNickname] = useState('');
  const [selectedAccent, setSelectedAccent] = useState(TERMINAL_ACCENTS[0]);
  const [hasJoined, setHasJoined] = useState(false);
  const [modalInput, setModalInput] = useState('');

  // Terminal Channel State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState<RoomUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showUsersDrawer, setShowUsersDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [systemClock, setSystemClock] = useState('');

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef(getSocket());

  // Clock
  useEffect(() => {
    const update = () => {
      setSystemClock(new Date().toTimeString().split(' ')[0]);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Connect socket and setup listeners
  useEffect(() => {
    if (!hasJoined) return;

    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-room', {
      roomId,
      nickname,
      color: selectedAccent.hex,
    });

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (soundEnabled && msg.senderId !== socket.id) {
        playMessageSound();
      }
    };

    const handleUserJoined = (sysMsg: Message) => {
      setMessages((prev) => [...prev, sysMsg]);
      if (soundEnabled) {
        playJoinSound();
      }
    };

    const handleUserLeft = (sysMsg: Message) => {
      setMessages((prev) => [...prev, sysMsg]);
    };

    const handleRoomUsers = (users: RoomUser[]) => {
      setActiveUsers(users);
    };

    const handleUserTyping = ({
      nickname: typingNick,
      isTyping,
    }: {
      nickname: string;
      isTyping: boolean;
    }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.includes(typingNick)) return [...prev, typingNick];
          return prev;
        } else {
          return prev.filter((u) => u !== typingNick);
        }
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('room-users', handleRoomUsers);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('room-users', handleRoomUsers);
      socket.off('user-typing', handleUserTyping);
      socket.emit('leave-room');
    };
  }, [hasJoined, roomId, nickname, selectedAccent, soundEnabled]);

  // Handle Nickname Modal Submit
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInput.trim()) return;
    playJoinSound();
    setNickname(modalInput.trim().toUpperCase());
    setHasJoined(true);
  };

  // Handle Send Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !hasJoined) return;

    playKeyClickSound();
    const socket = socketRef.current;
    socket.emit('send-message', {
      text: inputMessage,
      roomId,
    });

    socket.emit('typing', { isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setInputMessage('');
  };

  // Handle Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    const socket = socketRef.current;

    socket.emit('typing', { isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { isTyping: false });
    }, 1500);
  };

  // Copy Invite Link
  const handleCopyLink = () => {
    playKeyClickSound();
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setCopiedNotification(true);
    setTimeout(() => {
      setCopiedNotification(false);
    }, 3000);
  };

  // Exit channel
  const handleLeaveRoom = () => {
    playKeyClickSound();
    const socket = socketRef.current;
    socket.emit('leave-room');
    router.push('/');
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().split(' ')[0];
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 bg-black text-[#00FF66] font-mono select-text">
      
      {/* NICKNAME AUTH MODAL */}
      {!hasJoined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-lg term-window border-2 border-[#00FF66] bg-[#070b07] shadow-[0_0_30px_rgba(0,255,102,0.3)]">
            
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#00FF66] bg-[#00220d] text-xs font-bold">
              <span className="glow-green">[SYS_AUTH // IDENTITY_CHALLENGE]</span>
              <span className="text-[#008833]">[PORT: 3000]</span>
            </div>

            <div className="p-5 sm:p-7 space-y-5">
              <div className="text-xs text-[#008833] space-y-1">
                <div>&gt; CONNECTED TO NODE FREQUENCY: <span className="text-[#00FF66] font-bold">#{roomId}</span></div>
                <div>&gt; STATUS: ENCRYPTION_ESTABLISHED // IN-RAM ACTIVE</div>
                <div>&gt; PROMPT: ENTER OPERATOR IDENTITY TO COMMENCE TRANSMISSION</div>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="border border-[#008833] bg-[#020502] p-3 focus-within:border-[#00FF66] focus-within:shadow-[0_0_12px_rgba(0,255,102,0.3)]">
                  <label className="block text-[10px] text-[#008833] uppercase tracking-widest mb-1.5 font-bold">
                    OPERATOR_HANDLE // ENTER_ALIAS:
                  </label>
                  <div className="flex items-center">
                    <span className="text-[#00FF66] text-base font-bold mr-2 select-none">&gt;</span>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      autoFocus
                      placeholder="GHOST_OPERATOR"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      className="flex-1 bg-transparent text-[#00FF66] text-base font-mono uppercase font-bold placeholder-[#004419] focus:outline-none"
                    />
                    <span className="term-cursor" />
                  </div>
                </div>

                {/* Accent Frequency Select */}
                <div>
                  <label className="block text-[10px] text-[#008833] uppercase tracking-widest mb-1.5 font-bold">
                    SIGNAL_FREQUENCY_COLOR:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {TERMINAL_ACCENTS.map((accent) => (
                      <button
                        key={accent.name}
                        type="button"
                        onClick={() => setSelectedAccent(accent)}
                        className={`py-1.5 px-2 text-[10px] font-bold border transition-all ${
                          selectedAccent.name === accent.name
                            ? 'border-white bg-[#003311] shadow-[0_0_8px_rgba(0,255,102,0.5)]'
                            : 'border-[#004419] bg-[#020502] opacity-60 hover:opacity-100'
                        }`}
                        style={{ color: accent.hex }}
                      >
                        [{accent.name.split('_')[0]}]
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!modalInput.trim()}
                  className="w-full py-3 term-btn border-2 border-[#00FF66] bg-[#00220d] text-sm font-bold tracking-widest disabled:opacity-40"
                >
                  [ &gt; INITIALIZE_SESSION ]
                </button>
              </form>

              <div className="text-[10px] text-[#005522] text-center border-t border-[#00220d] pt-3">
                * Zero retention guarantee: This handle exists solely in active browser memory.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TERMINAL CHAT WINDOW */}
      <div className="w-full max-w-5xl h-[94vh] term-window border-2 border-[#00FF66] bg-[#060906] flex flex-col relative shadow-[0_0_30px_rgba(0,255,102,0.15)]">
        
        {/* RETRO STATUS BAR HEADER */}
        <header className="border-b-2 border-[#00FF66] bg-[#001809] px-3 py-2 select-none">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            
            {/* Left metadata tags */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#00FF66] glow-green flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#00FF66] inline-block animate-pulse" />
                TTY: #{roomId}
              </span>
              <span className="text-[#008833] hidden md:inline">|</span>
              <span className="text-[#00FF66]/90">
                RAM_STATE: <span className="text-[#FFCC00]">[VOLATILE]</span>
              </span>
              <span className="text-[#008833] hidden md:inline">|</span>
              <span className="text-[#00FF66]/90">
                OPERATORS_ONLINE: <span className="text-[#00FF66] font-bold">[{activeUsers.length.toString().padStart(2, '0')}]</span>
              </span>
              <span className="text-[#008833] hidden lg:inline">|</span>
              <span className="text-[#008833] text-[11px] hidden lg:inline">
                ID: &lt;{nickname || 'GUEST'}&gt;
              </span>
            </div>

            {/* Right Action Keycaps */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="term-btn px-2.5 py-1 text-[11px]"
                title="Copy full invite link"
              >
                {copiedNotification ? '[ ✓ LINK_COPIED ]' : '[ COPY_INVITE_LINK ]'}
              </button>

              <button
                onClick={() => setShowUsersDrawer(!showUsersDrawer)}
                className="term-btn px-2.5 py-1 text-[11px]"
                title="List active operators"
              >
                [ PEERS:{activeUsers.length} ]
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="term-btn px-2.5 py-1 text-[11px]"
                title="Toggle 8-bit audio blips"
              >
                {soundEnabled ? '[ BEEP: ON ]' : '[ BEEP: OFF ]'}
              </button>

              <button
                onClick={handleLeaveRoom}
                className="term-btn term-btn-red px-2.5 py-1 text-[11px]"
                title="Abort connection and purge memory"
              >
                [ ABORT / EXIT ]
              </button>
            </div>
          </div>
        </header>

        {/* ACTIVE PEERS OVERLAY DRAWER */}
        {showUsersDrawer && (
          <div className="absolute top-12 right-3 z-30 w-72 border-2 border-[#00FF66] bg-[#020502] p-3 shadow-[0_0_20px_rgba(0,255,102,0.25)]">
            <div className="flex items-center justify-between text-xs font-bold border-b border-[#008833] pb-1.5 mb-2">
              <span>ACTIVE_PEERS_IN_NODE ({activeUsers.length})</span>
              <button
                onClick={() => setShowUsersDrawer(false)}
                className="text-[#FF3333] hover:text-white"
              >
                [X]
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
              {activeUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-2 py-1 bg-[#051105] border border-[#003311]"
                >
                  <span className="font-bold truncate" style={{ color: u.color || '#00FF66' }}>
                    &gt; {u.nickname}
                  </span>
                  {u.nickname === nickname && (
                    <span className="text-[10px] text-[#FFCC00]">[YOU]</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COPY NOTIFICATION BANNER */}
        {copiedNotification && (
          <div className="bg-[#003311] border-b border-[#00FF66] px-4 py-1 text-center text-xs font-bold text-[#00FF66] glow-green">
            &gt;&gt; INVITE LINK COPIED TO SYSTEM CLIPBOARD. TRANSMIT FREQUENCY TO PEERS.
          </div>
        )}

        {/* LOG-STYLE CHAT STREAM */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 text-xs sm:text-sm font-mono bg-[#030603]">
          
          {/* Welcome log banner */}
          <div className="border border-[#004419] bg-[#010401] p-3 text-xs text-[#008833] space-y-1 select-none">
            <div>--------------------------------------------------------------------------------</div>
            <div className="text-[#00FF66] font-bold glow-green-sm">
              [SYSTEM] FREQUENCY #{roomId} INITIALIZED // ENCRYPTED TTY CONSOLE
            </div>
            <div>[POLICY] ALL TRANSMISSIONS ARE VOLATILE IN RAM // ZERO DISK PERSISTENCE</div>
            <div>[KEYCAPS] USE &apos;[ COPY_INVITE_LINK ]&apos; TO BRIDGE PEERS INTO THIS SECURE ENCLAVE</div>
            <div>--------------------------------------------------------------------------------</div>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const timeStr = formatTimestamp(msg.timestamp);

            if (msg.system) {
              return (
                <div key={msg.id} className="text-[#008833] py-0.5 flex items-start gap-2">
                  <span className="text-[#005522]">[{timeStr}]</span>
                  <span className="text-[#FFCC00] font-bold">[SYS_EVENT]</span>
                  <span className="text-[#00FF66]/80">&gt;&gt; {msg.text}</span>
                </div>
              );
            }

            const isSelf = msg.senderName === nickname;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 py-1 px-2 border-l-2 ${
                  isSelf
                    ? 'border-[#00FF66] bg-[#001f0b]/40 text-[#00FF66]'
                    : 'border-[#008833] bg-[#030803]/40 text-slate-200'
                }`}
              >
                {/* Timestamp */}
                <span className="text-[#008833] select-none shrink-0 font-mono">
                  [{timeStr}]
                </span>

                {/* Sender Tag */}
                {isSelf ? (
                  <span className="text-[#00FF66] font-extrabold glow-green shrink-0 select-none">
                    [YOU] &gt;&gt;
                  </span>
                ) : (
                  <span
                    className="font-bold shrink-0 select-none"
                    style={{ color: msg.senderColor || '#00FF66' }}
                  >
                    &lt;{msg.senderName}&gt; :
                  </span>
                )}

                {/* Text Message */}
                <span className="break-all whitespace-pre-wrap leading-relaxed flex-1">
                  {msg.text}
                </span>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* TYPING STATUS NOTICE */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-1 bg-[#010401] border-t border-[#003311] text-xs text-[#FFCC00] flex items-center gap-2 select-none">
            <span className="animate-pulse">⚡</span>
            <span>
              [SYS_NOTICE] OPERATOR {typingUsers.join(', ')} IS COMPOSING PAYLOAD...
            </span>
          </div>
        )}

        {/* COMMAND LINE TRANSMIT BAR */}
        <div className="border-t-2 border-[#00FF66] bg-[#020502] p-2.5 sm:p-3 select-none">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            
            {/* Shell Prompt Prefix */}
            <div className="flex items-center text-xs sm:text-sm font-bold text-[#00FF66] shrink-0">
              <span className="text-[#008833] hidden sm:inline">[{systemClock}]</span>
              <span className="text-[#FFCC00] ml-1 sm:ml-2">operator@ghost:~$</span>
            </div>

            {/* Input field */}
            <div className="flex-1 flex items-center border border-[#008833] bg-black px-3 py-2 focus-within:border-[#00FF66] focus-within:shadow-[0_0_10px_rgba(0,255,102,0.3)]">
              <input
                type="text"
                placeholder="TYPE TRANSMISSION PAYLOAD..."
                value={inputMessage}
                onChange={handleInputChange}
                className="flex-1 bg-transparent text-[#00FF66] text-xs sm:text-sm font-mono placeholder-[#004419] focus:outline-none"
              />
              <span className="term-cursor ml-1" />
            </div>

            {/* Transmit Command Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="term-btn px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              [ TRANSMIT ]
            </button>
          </form>

          <div className="flex justify-between items-center text-[10px] text-[#005522] mt-1.5 px-1 font-mono">
            <span>READY TO SEND // KEYSTROKE: [ENTER]</span>
            <span className="text-[#008833]">END-TO-END IN-MEMORY VOLATILE DATA STREAM</span>
          </div>
        </div>

      </div>
    </div>
  );
}
