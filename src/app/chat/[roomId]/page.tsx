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

  const [nickname, setNickname] = useState('');
  const [selectedAccent, setSelectedAccent] = useState(TERMINAL_ACCENTS[0]);
  const [hasJoined, setHasJoined] = useState(false);
  const [modalInput, setModalInput] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState<RoomUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showUsersDrawer, setShowUsersDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [systemClock, setSystemClock] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const update = () => setSystemClock(new Date().toTimeString().split(' ')[0]);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!hasJoined) return;

    const socket = socketRef.current;
    if (!socket.connected) socket.connect();

    socket.emit('join-room', { roomId, nickname, color: selectedAccent.hex });

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (soundEnabled && msg.senderId !== socket.id) playMessageSound();
    };
    const handleUserJoined = (sysMsg: Message) => {
      setMessages((prev) => [...prev, sysMsg]);
      if (soundEnabled) playJoinSound();
    };
    const handleUserLeft = (sysMsg: Message) => setMessages((prev) => [...prev, sysMsg]);
    const handleRoomUsers = (users: RoomUser[]) => setActiveUsers(users);
    const handleUserTyping = ({ nickname: typingNick, isTyping }: { nickname: string; isTyping: boolean }) => {
      setTypingUsers((prev) =>
        isTyping
          ? prev.includes(typingNick) ? prev : [...prev, typingNick]
          : prev.filter((u) => u !== typingNick)
      );
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

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInput.trim()) return;
    playJoinSound();
    setNickname(modalInput.trim().toUpperCase());
    setHasJoined(true);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !hasJoined) return;
    playKeyClickSound();
    socketRef.current.emit('send-message', { text: inputMessage, roomId });
    socketRef.current.emit('typing', { isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setInputMessage('');
    // Re-focus input on mobile after send
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    socketRef.current.emit('typing', { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { isTyping: false });
    }, 1500);
  };

  const handleCopyLink = () => {
    playKeyClickSound();
    navigator.clipboard.writeText(window.location.href);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handleLeaveRoom = () => {
    playKeyClickSound();
    socketRef.current.emit('leave-room');
    router.push('/');
  };

  const formatTimestamp = (ts: number) =>
    new Date(ts).toTimeString().split(' ')[0];

  return (
    /* 100dvh fixes mobile browser chrome (address bar) clipping */
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-1 sm:p-2 md:p-4 bg-black text-[#00FF66] font-mono overflow-x-hidden">

      {/* ── NICKNAME AUTH MODAL ────────────────────────────── */}
      {!hasJoined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm">
          {/* w-[90%] on mobile, max-w-lg on larger */}
          <div className="w-[90%] max-w-lg term-window border-2 border-[#00FF66] bg-[#070b07] shadow-[0_0_30px_rgba(0,255,102,0.3)]">

            {/* Modal Title Bar */}
            <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b-2 border-[#00FF66] bg-[#00220d] text-[10px] sm:text-xs font-bold gap-2">
              <span className="glow-green truncate">[SYS_AUTH // IDENTITY_CHALLENGE]</span>
              <span className="text-[#008833] shrink-0 hidden sm:inline">[PORT: 3000]</span>
            </div>

            <div className="p-3 sm:p-5 md:p-7 space-y-4 sm:space-y-5">
              {/* Connection info — compact on mobile */}
              <div className="text-[10px] sm:text-xs text-[#008833] space-y-1">
                <div>&gt; FREQUENCY: <span className="text-[#00FF66] font-bold break-all">#{roomId}</span></div>
                <div className="hidden sm:block">&gt; STATUS: ENCRYPTION_ESTABLISHED // IN-RAM ACTIVE</div>
                <div>&gt; ENTER OPERATOR IDENTITY TO TRANSMIT</div>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-3 sm:space-y-4">
                {/* Alias Input */}
                <div className="border border-[#008833] bg-[#020502] p-2.5 sm:p-3 focus-within:border-[#00FF66] focus-within:shadow-[0_0_12px_rgba(0,255,102,0.3)]">
                  <label className="block text-[9px] sm:text-[10px] text-[#008833] uppercase tracking-widest mb-1.5 font-bold">
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
                      /* text-base prevents iOS auto-zoom on focus */
                      className="flex-1 bg-transparent text-[#00FF66] text-base font-mono uppercase font-bold placeholder-[#004419] focus:outline-none min-w-0"
                    />
                    <span className="term-cursor" />
                  </div>
                </div>

                {/* Frequency Color — scrollable row on mobile */}
                <div>
                  <label className="block text-[9px] sm:text-[10px] text-[#008833] uppercase tracking-widest mb-1.5 font-bold">
                    SIGNAL_FREQUENCY_COLOR:
                  </label>
                  <div className="flex gap-1.5 sm:grid sm:grid-cols-5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {TERMINAL_ACCENTS.map((accent) => (
                      <button
                        key={accent.name}
                        type="button"
                        onClick={() => setSelectedAccent(accent)}
                        className={`py-1.5 px-2 text-[9px] sm:text-[10px] font-bold border transition-all shrink-0 ${
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
                  className="w-full py-3 term-btn border-2 border-[#00FF66] bg-[#00220d] text-xs sm:text-sm font-bold tracking-wider sm:tracking-widest disabled:opacity-40"
                >
                  [ &gt; INITIALIZE_SESSION ]
                </button>
              </form>

              <div className="text-[9px] sm:text-[10px] text-[#005522] text-center border-t border-[#00220d] pt-2 sm:pt-3">
                * Zero retention: Handle exists only in active browser memory.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN TERMINAL CHAT WINDOW ─────────────────────── */}
      {/* h-[92dvh] shrinks correctly when mobile browser chrome appears */}
      <div className="w-full max-w-5xl h-[92dvh] sm:h-[90dvh] md:h-[92dvh] term-window border-2 border-[#00FF66] bg-[#060906] flex flex-col relative shadow-[0_0_30px_rgba(0,255,102,0.15)]">

        {/* ── RETRO STATUS HEADER ─── */}
        <header className="border-b-2 border-[#00FF66] bg-[#001809] px-2 sm:px-3 py-1.5 sm:py-2 select-none shrink-0">
          {/* Two rows on mobile, one row on sm+ */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold">

            {/* Metadata row */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
              <span className="text-[#00FF66] glow-green flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00FF66] inline-block animate-pulse shrink-0" />
                {/* Truncate long room ID on mobile */}
                <span className="max-w-[80px] sm:max-w-none truncate">#{roomId}</span>
              </span>
              <span className="text-[#00FF66]/90 shrink-0">
                RAM:<span className="text-[#FFCC00]">[VOL]</span>
              </span>
              <span className="text-[#00FF66]/90 shrink-0">
                PEERS:<span className="text-[#00FF66] font-bold">[{activeUsers.length.toString().padStart(2, '0')}]</span>
              </span>
              <span className="text-[#008833] text-[10px] hidden md:inline">
                ID: &lt;{nickname || 'GUEST'}&gt;
              </span>
            </div>

            {/* Action buttons row — scrollable on mobile to avoid wrap overflow */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar shrink-0">
              <button
                onClick={handleCopyLink}
                className="term-btn px-2 py-1 text-[9px] sm:text-[11px] whitespace-nowrap shrink-0"
                title="Copy invite link"
              >
                {copiedNotification ? '[ ✓ COPIED ]' : '[ COPY_LINK ]'}
              </button>
              <button
                onClick={() => setShowUsersDrawer(!showUsersDrawer)}
                className="term-btn px-2 py-1 text-[9px] sm:text-[11px] whitespace-nowrap shrink-0"
                title="Show peers"
              >
                [ P:{activeUsers.length} ]
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="term-btn px-2 py-1 text-[9px] sm:text-[11px] whitespace-nowrap shrink-0"
                title="Toggle sound"
              >
                {soundEnabled ? '[ 🔔 ]' : '[ 🔕 ]'}
              </button>
              <button
                onClick={handleLeaveRoom}
                className="term-btn term-btn-red px-2 py-1 text-[9px] sm:text-[11px] whitespace-nowrap shrink-0"
                title="Exit and purge"
              >
                [ EXIT ]
              </button>
            </div>
          </div>
        </header>

        {/* ── PEERS DRAWER OVERLAY ─── */}
        {showUsersDrawer && (
          <div className="absolute top-auto bottom-20 sm:top-16 sm:bottom-auto right-2 sm:right-3 z-30 w-56 sm:w-72 border-2 border-[#00FF66] bg-[#020502] p-2.5 sm:p-3 shadow-[0_0_20px_rgba(0,255,102,0.25)]">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold border-b border-[#008833] pb-1.5 mb-2">
              <span>ACTIVE_PEERS ({activeUsers.length})</span>
              <button onClick={() => setShowUsersDrawer(false)} className="text-[#FF3333] hover:text-white ml-2">
                [X]
              </button>
            </div>
            <div className="space-y-1 sm:space-y-1.5 max-h-40 sm:max-h-48 overflow-y-auto text-[10px] sm:text-xs">
              {activeUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-2 py-1 bg-[#051105] border border-[#003311]">
                  <span className="font-bold truncate" style={{ color: u.color || '#00FF66' }}>
                    &gt; {u.nickname}
                  </span>
                  {u.nickname === nickname && (
                    <span className="text-[9px] sm:text-[10px] text-[#FFCC00] ml-2 shrink-0">[YOU]</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COPY NOTIFICATION BANNER ─── */}
        {copiedNotification && (
          <div className="bg-[#003311] border-b border-[#00FF66] px-2 sm:px-4 py-1 text-center text-[10px] sm:text-xs font-bold text-[#00FF66] glow-green shrink-0">
            &gt;&gt; INVITE LINK COPIED. TRANSMIT TO PEERS.
          </div>
        )}

        {/* ── LOG-STYLE CHAT STREAM (flex-1 = fills remaining height) ── */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-5 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs md:text-sm font-mono bg-[#030603] min-h-0">

          {/* Welcome banner */}
          <div className="border border-[#004419] bg-[#010401] p-2 sm:p-3 text-[10px] sm:text-xs text-[#008833] space-y-1 select-none">
            <div className="hidden sm:block">----------------------------------------</div>
            <div className="text-[#00FF66] font-bold glow-green-sm break-all">
              [SYSTEM] FREQUENCY #{roomId} INITIALIZED
            </div>
            <div className="hidden sm:block">[POLICY] ALL TRANSMISSIONS VOLATILE IN RAM // ZERO DISK</div>
            <div>[TIP] USE &apos;[ COPY_LINK ]&apos; TO INVITE PEERS</div>
            <div className="hidden sm:block">----------------------------------------</div>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const timeStr = formatTimestamp(msg.timestamp);

            if (msg.system) {
              return (
                <div key={msg.id} className="text-[#008833] py-0.5 flex items-start gap-1.5 sm:gap-2">
                  <span className="text-[#005522] shrink-0 font-mono">[{timeStr}]</span>
                  <span className="text-[#FFCC00] font-bold shrink-0">[SYS]</span>
                  <span className="text-[#00FF66]/80 break-words min-w-0">&gt;&gt; {msg.text}</span>
                </div>
              );
            }

            const isSelf = msg.senderName === nickname;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-1.5 sm:gap-2 py-1 px-1.5 sm:px-2 border-l-2 ${
                  isSelf
                    ? 'border-[#00FF66] bg-[#001f0b]/40 text-[#00FF66]'
                    : 'border-[#008833] bg-[#030803]/40 text-slate-200'
                }`}
              >
                {/* Timestamp — visible on sm+, hidden on tiny mobile */}
                <span className="text-[#008833] select-none shrink-0 font-mono hidden sm:inline">
                  [{timeStr}]
                </span>
                {/* Sender label */}
                {isSelf ? (
                  <span className="text-[#00FF66] font-extrabold glow-green shrink-0 select-none whitespace-nowrap">
                    [YOU]&gt;&gt;
                  </span>
                ) : (
                  <span
                    className="font-bold shrink-0 select-none truncate max-w-[80px] sm:max-w-none"
                    style={{ color: msg.senderColor || '#00FF66' }}
                  >
                    &lt;{msg.senderName}&gt;:
                  </span>
                )}
                {/* Message — break-words handles long unbroken strings */}
                <span className="break-words whitespace-pre-wrap leading-relaxed flex-1 min-w-0">
                  {msg.text}
                </span>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* ── TYPING INDICATOR ─── */}
        {typingUsers.length > 0 && (
          <div className="px-2 sm:px-4 py-1 bg-[#010401] border-t border-[#003311] text-[10px] sm:text-xs text-[#FFCC00] flex items-center gap-1.5 sm:gap-2 select-none shrink-0">
            <span className="animate-pulse shrink-0">⚡</span>
            <span className="truncate">
              {typingUsers.join(', ')} IS COMPOSING...
            </span>
          </div>
        )}

        {/* ── COMMAND LINE TRANSMIT BAR ─── */}
        <div className="border-t-2 border-[#00FF66] bg-[#020502] p-2 sm:p-2.5 md:p-3 select-none shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">

            {/* Shell prompt prefix — shortened on mobile */}
            <div className="flex items-center text-[10px] sm:text-xs md:text-sm font-bold text-[#00FF66] shrink-0">
              <span className="text-[#008833] hidden md:inline">[{systemClock}]</span>
              <span className="text-[#FFCC00] ml-0 md:ml-1 whitespace-nowrap">
                <span className="hidden sm:inline">operator@ghost:~$</span>
                <span className="sm:hidden">ghost:~$</span>
              </span>
            </div>

            {/* Input — text-base prevents iOS zoom, flex-1 fills available space */}
            <div className="flex-1 flex items-center border border-[#008833] bg-black px-2 sm:px-3 py-1.5 sm:py-2 focus-within:border-[#00FF66] focus-within:shadow-[0_0_8px_rgba(0,255,102,0.3)] min-w-0">
              <input
                ref={inputRef}
                type="text"
                placeholder="TRANSMIT PAYLOAD..."
                value={inputMessage}
                onChange={handleInputChange}
                /* text-base (16px) prevents iOS Safari auto-zoom on focus */
                className="flex-1 bg-transparent text-[#00FF66] text-base font-mono placeholder-[#004419] focus:outline-none min-w-0"
              />
              <span className="term-cursor ml-1 shrink-0 hidden sm:inline-block" />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="term-btn px-3 sm:px-4 md:px-6 py-2 text-[10px] sm:text-xs md:text-sm font-bold disabled:opacity-40 disabled:pointer-events-none shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">[ TRANSMIT ]</span>
              <span className="sm:hidden">[ TX ]</span>
            </button>
          </form>

          {/* Footer status — hidden on mobile to save space */}
          <div className="hidden sm:flex justify-between items-center text-[9px] sm:text-[10px] text-[#005522] mt-1 sm:mt-1.5 px-1 font-mono">
            <span>READY // KEYSTROKE: [ENTER]</span>
            <span className="text-[#008833]">IN-MEMORY VOLATILE STREAM</span>
          </div>
        </div>

      </div>
    </div>
  );
}
