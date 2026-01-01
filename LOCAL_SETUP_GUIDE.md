# Local Database Setup Guide

## Option 1: Firebase Emulator Suite (Recommended - No Code Changes Needed)

This runs Firebase locally on your computer. Your existing code will work without changes.

### Setup Steps:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase** (one-time setup):
   ```bash
   firebase login
   ```

3. **Start the Emulators**:
   ```bash
   firebase emulators:start
   ```
   
   This will start:
   - Firestore (database) on port 8080
   - Auth on port 9099
   - Storage on port 9199
   - Web UI on http://localhost:4000

4. **Enable Emulator Mode**:
   - Create a `.env` file in your project root:
     ```
     VITE_USE_EMULATOR=true
     ```
   - Or uncomment the emulator connection code in `firebase.ts`

5. **Run Your App**:
   ```bash
   npm run dev
   ```

6. **View Your Data**:
   - Open http://localhost:4000 in your browser
   - You'll see a web interface to view/edit your data

### Benefits:
- ✅ No code changes needed
- ✅ Works exactly like production Firebase
- ✅ Data persists in local files
- ✅ Free, runs completely offline
- ✅ Web UI to manage data

---

## Option 2: PocketBase (Alternative - Minimal Setup)

A lightweight, self-hosted backend that's very easy to set up.

### Setup Steps:

1. **Download PocketBase**:
   - Go to: https://pocketbase.io/docs/
   - Download the Windows executable (pocketbase.exe)
   - Place it in a folder (e.g., `C:\pocketbase\`)

2. **Run PocketBase**:
   ```bash
   cd C:\pocketbase
   .\pocketbase.exe serve
   ```
   
   This starts PocketBase on http://127.0.0.1:8090

3. **Set Up Admin Account**:
   - Open http://127.0.0.1:8090/_/ in your browser
   - Create an admin account (first time only)

4. **Create Collections** (via Web UI):
   - Click "New Collection"
   - Create collections matching your Firebase collections:
     - `landingPages`
     - `formSubmissions`
     - `registrationForms`
     - `certificateTemplates`

### Benefits:
- ✅ Single executable file
- ✅ Beautiful web UI
- ✅ Built-in authentication
- ✅ File storage included
- ✅ REST API (would need code changes to use)

---

## Option 3: JSON Server (Simplest - For Testing Only)

Super simple, but limited features. Good for quick testing.

### Setup Steps:

1. **Install JSON Server**:
   ```bash
   npm install -g json-server
   ```

2. **Create a `db.json` file** in your project:
   ```json
   {
     "landingPages": [],
     "formSubmissions": [],
     "registrationForms": [],
     "certificateTemplates": []
   }
   ```

3. **Start JSON Server**:
   ```bash
   json-server --watch db.json --port 3000
   ```

### Benefits:
- ✅ Extremely simple
- ✅ No setup required
- ⚠️ Limited features (no auth, no file storage)
- ⚠️ Would require code changes

---

## Quick Comparison

| Solution | Setup Time | Code Changes | Features | Best For |
|----------|-----------|--------------|----------|----------|
| **Firebase Emulator** | 5 min | None | Full Firebase | ✅ **Recommended** |
| **PocketBase** | 10 min | Some | Full backend | Alternative |
| **JSON Server** | 2 min | Many | Basic CRUD | Quick testing |

---

## Troubleshooting

### Firebase Emulator Issues:

**Port already in use:**
- Change ports in `firebase.json`
- Or stop other services using those ports

**Can't connect to emulator:**
- Make sure emulators are running: `firebase emulators:start`
- Check that `VITE_USE_EMULATOR=true` is set

**Data not persisting:**
- Emulator data is stored in `firebase-export/` folder
- Use `firebase emulators:export ./firebase-export` to save
- Use `firebase emulators:start --import ./firebase-export` to load

---

## Recommendation

**Start with Firebase Emulator Suite** - it's the easiest since you're already using Firebase, requires no code changes, and works exactly like production.

