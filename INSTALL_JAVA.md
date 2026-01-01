# Installing Java 21+ for Firebase Emulators

Installing Java 21+ is actually a **great choice** if you want to use Firebase Emulators! Here's why and how:

## Why Install Java 21+?

✅ **You're already set up for Firebase** - Your code is ready, just needs Java
✅ **No code changes needed** - Everything works as-is
✅ **Exact production match** - Emulators behave like real Firebase
✅ **One-time setup** - Install once, use forever
✅ **Free** - Java is completely free

## Quick Installation Guide

### Step 1: Download Java 21

**Option A: Adoptium (Recommended - Free, Open Source)**
1. Go to: https://adoptium.net/temurin/releases/
2. Select:
   - **Version:** 21 (LTS)
   - **Operating System:** Windows
   - **Architecture:** x64
   - **Package Type:** JDK
3. Click **"Latest Release"** button
4. Download the `.msi` installer (e.g., `OpenJDK21U-jdk_x64_windows_hotspot_21.0.1_12.msi`)

**Option B: Oracle JDK (Official)**
1. Go to: https://www.oracle.com/java/technologies/downloads/#jdk21-windows
2. Download: `jdk-21_windows-x64_bin.exe`
3. Note: Requires Oracle account (free)

### Step 2: Install Java

1. **Run the installer** you downloaded
2. **Follow the installation wizard:**
   - Click "Next" through the setup
   - **IMPORTANT:** Check the box for **"Set JAVA_HOME variable"** (if available)
   - Or check **"Add to PATH"**
   - Click "Install"
   - Wait for installation to complete
   - Click "Close"

### Step 3: Verify Installation

Open a **NEW** PowerShell/Command Prompt window (important - restart terminal):

```powershell
java -version
```

You should see something like:
```
openjdk version "21.0.1" 2024-04-16
OpenJDK Runtime Environment Temurin-21.0.1+12 (build 21.0.1+12)
OpenJDK 64-Bit Server VM Temurin-21.0.1+12 (build 21.0.1+12, mixed mode, sharing)
```

If you see version 21 or higher, you're good! ✅

### Step 4: Set JAVA_HOME (If Not Auto-Set)

If `java -version` doesn't work, you may need to set JAVA_HOME manually:

1. **Find Java installation path:**
   - Usually: `C:\Program Files\Eclipse Adoptium\jdk-21.0.1.12-hotspot`
   - Or: `C:\Program Files\Java\jdk-21`

2. **Set Environment Variable:**
   - Press `Win + X` → **System**
   - Click **"Advanced system settings"**
   - Click **"Environment Variables"**
   - Under **"System variables"**, click **"New"**
     - Variable name: `JAVA_HOME`
     - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-21.0.1.12-hotspot` (your actual path)
   - Click **OK**

3. **Add to PATH:**
   - In Environment Variables, find **"Path"** in System variables
   - Click **"Edit"**
   - Click **"New"**
   - Add: `%JAVA_HOME%\bin`
   - Click **OK** on all dialogs

4. **Restart terminal** and verify again:
   ```powershell
   java -version
   ```

### Step 5: Start Firebase Emulators

Now you can run:

```bash
firebase emulators:start
```

You should see:
```
✔  All emulators ready! It is now safe to connect.
```

### Step 6: Access Emulator UI

Open in browser: **http://localhost:4000**

You'll see:
- Firestore (database) - view/edit your data
- Auth - manage users
- Storage - manage files

## Troubleshooting

### "Java not found" after installation
- **Restart your terminal** (close and reopen)
- Check PATH: `echo $env:Path` (should include Java)
- Verify: `java -version`

### "Port already in use"
- Change ports in `firebase.json`
- Or stop other services using ports 8080, 9099, 9199

### "Permission denied"
- Run terminal as Administrator
- Or change emulator ports to higher numbers (like 18080, 19099, 19199)

## Java Installation Size

- **Download:** ~200-300 MB
- **Installation:** ~500 MB disk space
- **Total:** Less than 1 GB

## Benefits of This Approach

✅ **No code changes** - Your existing Firebase code works
✅ **Production-like** - Emulators match real Firebase behavior
✅ **Integrated** - Auth, Firestore, Storage all work together
✅ **Web UI** - Visual interface at localhost:4000
✅ **Data persistence** - Can export/import data

## Next Steps After Installation

1. Start emulators: `firebase emulators:start`
2. Make sure `.env` has: `VITE_USE_EMULATOR=true`
3. Run your app: `npm run dev`
4. Your app will connect to local emulators automatically!

## Alternative: If You Don't Want Java

If you prefer not to install Java, see:
- `QUICK_START.md` - For JSON Server (simplest)
- `POCKETBASE_SETUP.md` - For PocketBase (full solution)

But honestly, **installing Java 21+ is the easiest path** if you want to keep using Firebase! 🚀

