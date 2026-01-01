# Java-Free Local Database Solutions

Since Firebase Emulators require Java 21+, here are better alternatives that don't need Java:

## Option 1: PocketBase ⭐ (Recommended)

**Best for:** Full-featured backend without Java

- ✅ Single executable (no installation)
- ✅ No Java required
- ✅ Web UI included
- ✅ Built-in authentication
- ✅ File storage
- ⚠️ Requires code changes to use REST API

**Setup:** See `POCKETBASE_SETUP.md`

---

## Option 2: JSON Server (Simplest)

**Best for:** Quick testing, minimal setup

### Setup:

1. **Install:**
   ```bash
   npm install -g json-server
   ```

2. **Create `db.json` file:**
   ```json
   {
     "landingPages": [],
     "formSubmissions": [],
     "registrationForms": [],
     "certificateTemplates": []
   }
   ```

3. **Run:**
   ```bash
   json-server --watch db.json --port 3000
   ```

**Pros:**
- ✅ No Java, no installation
- ✅ Works immediately
- ✅ Data in JSON file

**Cons:**
- ❌ No authentication
- ❌ No file storage
- ❌ Would need code changes

---

## Option 3: Install Java 21 (If you want Firebase Emulators)

If you really want to use Firebase Emulators:

### Quick Java Installation:

1. **Download Java 21:**
   - Go to: https://adoptium.net/temurin/releases/
   - Download: **JDK 21** for Windows x64
   - Choose: `.msi` installer

2. **Install:**
   - Run the installer
   - Check "Set JAVA_HOME variable" during installation
   - Finish installation

3. **Verify:**
   ```powershell
   java -version
   ```
   Should show version 21 or higher

4. **Restart terminal and run:**
   ```bash
   firebase emulators:start
   ```

**Note:** This requires ~200MB download and installation.

---

## Option 4: Docker (Advanced)

If you have Docker installed, you can run Supabase locally:

```bash
docker run -d --name supabase -p 54321:54321 supabase/supabase
```

But this is more complex and requires Docker setup.

---

## My Recommendation

**Use PocketBase** - It's the easiest solution that doesn't require:
- ❌ Java installation
- ❌ Complex setup
- ❌ Docker
- ❌ Multiple dependencies

Just download one file and run it!

See `POCKETBASE_SETUP.md` for detailed instructions.

