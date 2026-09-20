import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GHOST_TERMINAL // SECURE_TTY_v4.0',
  description: 'Retro Cyberpunk CMD In-Memory Terminal Chatting Application. 0-Logs. 0-Database.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-[#00FF66] font-mono min-h-screen relative selection:bg-[#00FF66] selection:text-black">
        {/* CRT Scanline & Monitor Overlay */}
        <div className="crt-overlay" />
        <div className="crt-vignette" />

        <main className="relative z-10 min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
