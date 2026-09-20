'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { playKeyClickSound, playJoinSound } from '@/lib/audio';

const BOOT_LOGS = [
  '[SYS_INIT] BIOS_VERSION: 0x9942 // CRT_PHOSPHOR_ACTIVE',
  '[SECURITY] ZERO_DATABASE_POLICY: ENFORCED [0-PERSISTENCE]',
  '[SECURITY] STORAGE_DRIVES: DISCONNECTED // IN-MEMORY ONLY',
  '[SOCKET] WEBSOCKET_DAEMON: LISTENING ON PORT 3000',
  '[PROTOCOL] P2P_EMPH_BROADCAST: READY FOR CHANNEL ALLOCATION',
];

export default function TerminalLandingPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logsVisible, setLogsVisible] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    BOOT_LOGS.forEach((log, index) => {
      setTimeout(() => {
        setLogsVisible((prev) => [...prev, log]);
      }, (index + 1) * 160);
    });
  }, []);

  const handleCreateRoom = () => {
    playKeyClickSound();
    setIsExecuting(true);
    const id = nanoid(8);
    setTimeout(() => {
      playJoinSound();
      router.push(`/chat/${id}`);
    }, 400);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    playKeyClickSound();
    if (!joinCode.trim()) return;

    let cleanCode = joinCode.trim();
    if (cleanCode.includes('/chat/')) {
      const parts = cleanCode.split('/chat/');
      cleanCode = parts[parts.length - 1];
    }
    cleanCode = cleanCode.split('?')[0].replace(/\/$/, '');
    if (cleanCode) router.push(`/chat/${cleanCode}`);
  };

  return (
    /* Use 100dvh to fix mobile browser address bar clipping */
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-2 sm:p-4 md:p-6 bg-black text-[#00FF66] font-mono overflow-x-hidden">
      
      {/* Main Terminal Window Frame — responsive max-width */}
      <div className="w-full max-w-xs sm:max-w-xl md:max-w-3xl term-window border-2 border-[#00FF66] bg-[#060a06] shadow-[0_0_30px_rgba(0,255,102,0.15)] relative">

        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b-2 border-[#00FF66] bg-[#00220d] text-[10px] sm:text-xs font-bold select-none gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#00FF66] shadow-[0_0_8px_#00FF66] shrink-0" />
            {/* Full title on sm+, short on mobile */}
            <span className="glow-green uppercase tracking-wider truncate hidden sm:inline">
              TERMINAL // TTY_SECURE_GHOST_NET [v4.0.9]
            </span>
            <span className="glow-green uppercase tracking-wider truncate sm:hidden">
              GHOST_NET TTY [v4.0]
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <span className="text-[#008833] hidden md:inline">[{currentTime}]</span>
            <span className="text-[#00FF66] hidden sm:inline">[CONNECTED]</span>
            <div className="flex items-center gap-1">
              <span className="px-1 bg-[#003311] border border-[#008833] text-[10px] text-[#00FF66]">_</span>
              <span className="px-1 bg-[#003311] border border-[#008833] text-[10px] text-[#00FF66]">□</span>
              <span className="px-1 bg-[#003311] border border-[#FF3333] text-[10px] text-[#FF3333]">X</span>
            </div>
          </div>
        </div>

        {/* Terminal Content Body */}
        <div className="p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6">

          {/* ASCII Banner — hidden on mobile (too wide), shown on sm+ */}
          <div className="hidden sm:block overflow-x-auto text-center select-none py-1">
            <pre className="inline-block text-[7px] sm:text-[9px] md:text-[11px] text-[#00FF66] font-bold leading-tight glow-green">
{`
 ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗   ███╗   ██╗███████╗████████╗
██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝   ████╗  ██║██╔════╝╚══██╔══╝
██║  ███╗███████║██║   ██║███████╗   ██║      ██╔██╗ ██║█████╗     ██║   
██║   ██║██╔══██║██║   ██║╚════██║   ██║      ██║╚██╗██║██╔══╝     ██║   
╚██████╔╝██║  ██║╚██████╔╝███████║   ██║      ██║ ╚████║███████╗   ██║   
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝      ╚═╝  ╚═══╝╚══════╝   ╚═╝   
`}
            </pre>
            <div className="text-[10px] sm:text-xs text-[#008833] tracking-widest mt-1">
              [ 100% IN-MEMORY // EPHEMERAL PEER-TO-PEER ENCLAVE ]
            </div>
          </div>

          {/* Mobile-only compact header banner */}
          <div className="sm:hidden text-center py-2 border border-[#004419] bg-[#020502]">
            <div className="text-sm font-bold glow-green text-[#00FF66] tracking-widest">
              &gt;&gt; GHOST_NET &lt;&lt;
            </div>
            <div className="text-[10px] text-[#008833] mt-1">
              100% IN-MEMORY EPHEMERAL CHAT
            </div>
          </div>

          {/* Diagnostics Boot Log — scrollable, compact on mobile */}
          <div className="p-2 sm:p-3 bg-[#020502] border border-[#008833] text-[10px] sm:text-xs font-mono space-y-1">
            <div className="text-[#008833] text-[9px] sm:text-[10px] uppercase tracking-wider pb-1 border-b border-[#003311]">
              --- SYSTEM DIAGNOSTIC INITIALIZATION LOG ---
            </div>
            {logsVisible.map((log, i) => (
              <div key={i} className="text-[#00FF66]/80 flex items-start gap-1.5 sm:gap-2 break-all">
                <span className="text-[#008833] select-none shrink-0">&gt;</span>
                <span className="break-words min-w-0">{log}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 text-[#00FF66]">
              <span className="text-[#008833] select-none">&gt;</span>
              <span className="glow-green font-bold">READY FOR OPERATOR COMMAND</span>
              <span className="term-cursor" />
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isExecuting}
            className="w-full py-3 sm:py-4 px-3 sm:px-6 term-btn border-2 border-[#00FF66] bg-[#00220d] text-[#00FF66] text-xs sm:text-sm md:text-base font-bold tracking-wider sm:tracking-widest transition-all duration-150 flex items-center justify-center gap-2 sm:gap-3 group"
          >
            <span className="text-[#FFCC00] group-hover:text-black shrink-0">⚡</span>
            <span className="text-center leading-snug">
              {isExecuting ? 'INITIALIZING...' : '[ > EXECUTE: CREATE_SECURE_ROOM ]'}
            </span>
            <span className="text-[#FFCC00] group-hover:text-black shrink-0">⚡</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 h-px bg-[#004419]" />
            <span className="text-[9px] sm:text-xs text-[#008833] uppercase tracking-wider text-center whitespace-nowrap">
              -- OR JOIN EXISTING --
            </span>
            <div className="flex-1 h-px bg-[#004419]" />
          </div>

          {/* Join with Channel Code — stacks on mobile */}
          <form onSubmit={handleJoinWithCode} className="flex flex-col gap-2">
            <div className="flex items-center border border-[#008833] bg-[#020502] px-2 sm:px-3 py-2 sm:py-2.5 focus-within:border-[#00FF66] focus-within:shadow-[0_0_10px_rgba(0,255,102,0.2)]">
              <span className="text-[#008833] text-[10px] sm:text-sm mr-1.5 sm:mr-2 select-none whitespace-nowrap">&gt; INPUT:</span>
              <input
                type="text"
                placeholder="ROOM_ID or INVITE_URL"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                /* text-base prevents mobile zoom on focus */
                className="flex-1 bg-transparent text-[#00FF66] text-base font-mono placeholder-[#005522] focus:outline-none min-w-0"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="w-full py-2.5 term-btn border border-[#00FF66] text-xs font-bold disabled:opacity-40 disabled:pointer-events-none"
            >
              [ CONNECT_NODE ]
            </button>
          </form>

          {/* Terminal Specs Grid — 1 col mobile, 3 col sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-[#003311]">
            <div className="p-2 sm:p-2.5 border border-[#004419] bg-[#020502]">
              <div className="text-[10px] sm:text-xs font-bold text-[#00FF66] flex items-center gap-1.5 mb-1">
                <span className="text-[#FFCC00]">[✓]</span> NO_DATABASE
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#008833] leading-relaxed">
                Zero disk writes. Packets exist only in active server RAM.
              </div>
            </div>
            <div className="p-2 sm:p-2.5 border border-[#004419] bg-[#020502]">
              <div className="text-[10px] sm:text-xs font-bold text-[#00FF66] flex items-center gap-1.5 mb-1">
                <span className="text-[#FFCC00]">[✓]</span> DYNAMIC_TTY
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#008833] leading-relaxed">
                High-entropy Nanoid frequency allocation per session.
              </div>
            </div>
            <div className="p-2 sm:p-2.5 border border-[#004419] bg-[#020502]">
              <div className="text-[10px] sm:text-xs font-bold text-[#FF3333] flex items-center gap-1.5 mb-1">
                <span className="text-[#FF3333]">[!]</span> PURGE_ON_EXIT
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#008833] leading-relaxed">
                Disconnecting evicts session and vanishes channel traces.
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Bottom Status Bar */}
        <div className="px-2 sm:px-3 py-1 sm:py-1.5 border-t border-[#004419] bg-[#020502] text-[9px] sm:text-[10px] text-[#008833] flex flex-wrap justify-between items-center gap-1 select-none">
          <span className="hidden sm:inline">HOST: 127.0.0.1 // DEV_TTY: /dev/pts/0</span>
          <span className="text-[#00FF66] glow-green-sm">ENCRYPTION: VOLATILE_IN_RAM</span>
          <span>PRESS [ENTER] TO TRANSMIT</span>
        </div>
      </div>
    </div>
  );
}
