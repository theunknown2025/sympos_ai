# Quick Start - Local Database (No Java Required!)

Since Firebase Emulators need Java 21+, here are **3 easy alternatives**:

---

## 🚀 Option 1: JSON Server (Start in 30 seconds!)

**The absolute simplest solution - works immediately!**

### Setup:

```bash
# Install json-server (one-time)
npm install

# Start the local database
npm run json-server
```

That's it! Your database is now running on http://localhost:3000

**View your data:** Open http://localhost:3000 in your browser

**Note:** This is a simple REST API. You can test it by visiting:
- http://localhost:3000/landingPages
- http://localhost:3000/formSubmissions
- etc.

**Limitations:**
- No authentication (anyone can access)
- No file storage
- Would need code changes to use (but good for testing!)

---

## ⭐ Option 2: PocketBase (Best Full Solution)

**Full-featured backend, no Java, single executable!**

### Quick Setup:

1. **Download:**
   - Go to: https://github.com/pocketbase/pocketbase/releases
   - Download: `pocketbase_X.X.X_windows_amd64.zip`
   - Extract `pocketbase.exe`

2. **Place it in your project folder:**
   - Put `pocketbase.exe` in `C:\Users\Dell\Desktop\Sora_digital\Sympos-ia\`

3. **Run:**
   ```powershell
   .\start-pocketbase.bat
   ```
   Or manually:
   ```powershell
   .\pocketbase.exe serve
   ```

4. **Access:**
   - Admin UI: http://127.0.0.1:8090/_/
   - API: http://127.0.0.1:8090/api/

5. **Create collections** (see `POCKETBASE_SETUP.md` for details)

**Benefits:**
- ✅ No Java required
- ✅ Beautiful web UI
- ✅ Built-in auth
- ✅ File storage
- ✅ REST API ready

---

## ☕ Option 3: Install Java 21+ (Recommended for Firebase!)

**Actually, this is a GREAT choice!** Since you're already using Firebase, installing Java lets you use Firebase Emulators with zero code changes.

### Why This Is Good:
- ✅ **No code changes** - Your existing Firebase code works immediately
- ✅ **Production-like** - Emulators behave exactly like real Firebase
- ✅ **One-time setup** - Install Java once, use forever
- ✅ **Free** - Java is completely free
- ✅ **Web UI** - Beautiful interface at localhost:4000

### Quick Setup:

1. **Download Java 21:**
   - Go to: https://adoptium.net/temurin/releases/
   - Select: Version 21, Windows, x64, JDK
   - Download the `.msi` installer

2. **Install:**
   - Run the installer
   - Check "Set JAVA_HOME" option (if available)
   - Finish installation

3. **Verify:**
   ```powershell
   # Open NEW terminal window
   java -version
   ```
   Should show version 21 or higher

4. **Start Emulators:**
   ```bash
   firebase emulators:start
   ```

5. **Access Web UI:**
   - Open: http://localhost:4000
   - View/edit your data visually!

**See `INSTALL_JAVA.md` for detailed instructions.**

---

## 📊 Comparison

| Solution | Setup Time | Java Needed | Code Changes | Features | Best For |
|----------|-----------|-------------|--------------|----------|----------|
| **Java + Firebase** | 10 min | ✅ Yes | ❌ **None!** | Full Firebase | ⭐ **Best if using Firebase** |
| **PocketBase** | 5 min | ❌ No | ⚠️ Some | Full backend | Good alternative |
| **JSON Server** | 30 sec | ❌ No | ⚠️ Many | Basic REST API | Quick testing only |

---

## 🎯 My Recommendation

**If you want to keep using Firebase:** Install Java 21+ - it's the easiest path with no code changes!

**If you want to avoid Java:** Use PocketBase - it's a great alternative that doesn't need Java.

Both are valid choices! 🎉

