# Deployment Guide — GhostChat (Next.js + Socket.io)

## ⚠️ Important Note About Vercel & WebSockets

**Vercel is a Serverless platform** (AWS Lambda under the hood).
- Vercel functions execute per request and freeze after responding.
- Vercel **does not support long-running Node.js processes (`server.js`)** or persistent stateful WebSocket connections (`socket.io`).
- If you deploy *only* to Vercel, the UI will render, but WebSockets will not connect because `server.js` does not run on Vercel.

Below are the **two industry-standard solutions**:

---

## 🌟 Option 1: Deploy on Render.com (Recommended, 100% Free & Easiest)

Render natively supports persistent Node.js servers and full-duplex WebSockets. Both your Next.js app and Socket.io server run together in one service for free.

### Steps:
1. Push your code to a GitHub repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) and log in.
3. Click **"New +"** -> **"Web Service"**.
4. Connect your GitHub repository.
5. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
6. Click **"Create Web Service"**.
7. Done! Your app will be live with full real-time WebSockets.

---

## ⚡ Option 2: Deploy Frontend on Vercel + Backend on Render/Railway

If you want your frontend hosted on Vercel (`your-app.vercel.app`):

### Step 1: Deploy the Socket.io Server
Deploy `server.js` on Render or Railway as a Web Service (following Option 1). You will get a URL like `https://ghost-chat-backend.onrender.com`.

### Step 2: Deploy Frontend to Vercel
1. Run in your terminal:
   ```bash
   npx vercel
   ```
2. Or import your GitHub repo on [vercel.com](https://vercel.com).
3. In Vercel Project Settings, add this **Environment Variable**:
   - **Key**: `NEXT_PUBLIC_SOCKET_URL`
   - **Value**: `https://ghost-chat-backend.onrender.com` (your backend URL)
4. Click **Deploy**!
