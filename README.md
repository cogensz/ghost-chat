# 👻 GhostChat — Private Ephemeral Messaging Web Application

A completely private, zero-retention, in-memory real-time group chat web application built with **Next.js (App Router)**, **Tailwind CSS**, **Socket.io**, and **Framer Motion**, wrapped in a strict dark mode **hyper-glassmorphism** aesthetic.

---

## 🔒 Core Privacy & Ephemerality Architecture

- **Zero Database & Zero Disk Logging**:
  Messages are NEVER written to any database (no Supabase, Firebase, MongoDB, or SQL) or stored to disk.
- **Pure In-Memory WebSockets**:
  All real-time communication lives exclusively in volatile server RAM through isolated Socket.io rooms.
- **Instant Eviction & Auto-Destruct**:
  When all participants leave a room or close their browsers, the room and all associated message state vanish forever.

---

## ✨ Features

- 🌌 **Hyper-Glassmorphism UI**:
  Frosted glass panels (`backdrop-blur-2xl`, `bg-white/5`, `border-white/10`), floating cards, glowing mesh gradient background, and luminous electric purple/cyan accents.
- 🎲 **Dynamic Room Generation**:
  Landing page generates high-entropy, unique Room IDs using `nanoid` and immediately redirects to `/chat/[roomId]`.
- 🔗 **One-Click Invite Link Sharing**:
  A prominent "Copy Invite Link" button in the room header copies the direct URL to the clipboard with animated confetti feedback.
- 🎭 **Temporary Nickname & Identity Modal**:
  When someone opens an invite link, a sleek modal prompts them to pick a temporary handle and custom avatar color before joining.
- 💬 **Differentiated Message Bubbles**:
  - **Your messages**: Aligned right with glowing purple-to-indigo gradient and glass reflection.
  - **Peers' messages**: Aligned left in smoked frosted glass with color tags.
  - **System events**: Centered translucent status pills for join and leave events.
- ⚡ **Real-Time Presence & Typing Indicators**:
  See who is online with an active participants counter and drawer, alongside real-time "typing..." animation.
- 🔔 **Zero-Dependency Web Audio Chimes**:
  Built-in crystal chimes synthesized directly through the browser Web Audio API for incoming messages and room joins (with a mute toggle).
- 🚀 **Quick Reactions**:
  One-tap emoji reactions (🔥, 👻, ❤️, 👏, 🔒, 😂) for fast responses.

---

## 📁 Project Structure

```
├── package.json               # Scripts & dependencies (Next.js, Socket.io, Framer Motion, Lucide)
├── server.js                  # Unified custom Node HTTP server hosting Next.js + Socket.io
├── tsconfig.json              # TypeScript configuration with @/* alias
├── tailwind.config.js         # Custom glassmorphism tokens, colors, and keyframe animations
├── postcss.config.mjs         # PostCSS configuration
├── next.config.mjs            # Next.js configuration
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with dark theme & ambient glow orbs
│   │   ├── globals.css        # Hyper-glassmorphism CSS classes & mesh gradient
│   │   ├── page.tsx           # Landing page with room generator & join input
│   │   └── chat/
│   │       └── [roomId]/
│   │           └── page.tsx   # Dynamic in-memory chat room with nickname modal
│   └── lib/
│       ├── socket.ts          # Client-side Socket.io connector
│       └── audio.ts           # Web Audio API chime synthesizer
└── README.md
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Run
```bash
npm run build
npm start
```

---

## 🧪 Testing Multi-User Ephemeral Chat

1. Open [http://localhost:3000](http://localhost:3000) and click **"Create a Secure Chat"**.
2. Enter a nickname (e.g. `Alice`) and click **Enter Secure Channel**.
3. Click **"Copy Invite Link"** in the top bar.
4. Open an **Incognito Window** (or second browser tab) and paste the invite URL.
5. Enter a nickname for user 2 (e.g. `Bob`).
6. Notice:
   - `Bob` appears in the participant counter immediately.
   - `Bob joined the secure channel` system pill displays.
   - Start typing in one window; observe real-time typing indicators in the other.
   - Send messages; observe instant delivery and audio notification chimes.
7. Close both windows or restart the server; all messages are instantly purged from existence.
