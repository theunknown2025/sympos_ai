# PocketBase Local Setup (No Java Required!)

PocketBase is a lightweight, self-hosted backend that runs as a single executable file. No Java, no complex setup!

## Quick Setup (5 minutes)

### Step 1: Download PocketBase

1. Go to: https://github.com/pocketbase/pocketbase/releases
2. Download: `pocketbase_X.X.X_windows_amd64.zip` (latest version)
3. Extract the ZIP file
4. You'll get `pocketbase.exe` - this is all you need!

### Step 2: Create a Folder for PocketBase

```powershell
# Create a folder (you can put it anywhere)
mkdir C:\pocketbase
# Move pocketbase.exe there
```

### Step 3: Run PocketBase

```powershell
cd C:\pocketbase
.\pocketbase.exe serve
```

You'll see:
```
> Server started at http://127.0.0.1:8090
> Admin UI available at http://127.0.0.1:8090/_
```

### Step 4: Set Up Admin Account (First Time Only)

1. Open http://127.0.0.1:8090/_/ in your browser
2. Create an admin account (email + password)
3. You're done! 🎉

### Step 5: Create Your Collections

In the PocketBase admin UI (http://127.0.0.1:8090/_/):

1. Click **"New Collection"**
2. Create these collections (one by one):

#### Collection 1: `landingPages`
- Fields:
  - `userId` (Text, required)
  - `title` (Text, required)
  - `config` (JSON, required)
  - `createdAt` (Date, required)
  - `updatedAt` (Date, required)

#### Collection 2: `formSubmissions`
- Fields:
  - `formId` (Text, required)
  - `eventId` (Text, required)
  - `eventTitle` (Text)
  - `userId` (Text, required)
  - `submittedBy` (Text)
  - `generalInfo` (JSON)
  - `answers` (JSON)
  - `submittedAt` (Date, required)

#### Collection 3: `registrationForms`
- Fields:
  - `userId` (Text, required)
  - `title` (Text, required)
  - `description` (Text)
  - `sections` (JSON)
  - `fields` (JSON)
  - `generalInfo` (JSON)
  - `createdAt` (Date, required)
  - `updatedAt` (Date, required)

#### Collection 4: `certificateTemplates`
- Fields:
  - `userId` (Text, required)
  - `title` (Text, required)
  - `backgroundImage` (Text)
  - `backgroundImageType` (Text)
  - `width` (Number)
  - `height` (Number)
  - `elements` (JSON)
  - `createdAt` (Date, required)
  - `updatedAt` (Date, required)

### Step 6: Set Collection Rules (Make them accessible)

For each collection, go to **Settings** → **API Rules**:

**List/Search Rule:** `@request.auth.id != ""` (authenticated users)
**View Rule:** `@request.auth.id != ""` (authenticated users)
**Create Rule:** `@request.auth.id != ""` (authenticated users)
**Update Rule:** `@request.auth.id = @request.data.userId` (only owner can update)
**Delete Rule:** `@request.auth.id = @request.data.userId` (only owner can delete)

## Benefits

✅ **No Java required** - Single executable file
✅ **No installation** - Just download and run
✅ **Beautiful web UI** - Manage data visually
✅ **Built-in auth** - User authentication included
✅ **File storage** - Can store files/images
✅ **REST API** - Works with your app
✅ **Free & Open Source**

## Data Location

Your data is stored in: `C:\pocketbase\pb_data\` folder

## Running PocketBase Automatically

Create a batch file `start-pocketbase.bat`:

```batch
@echo off
cd C:\pocketbase
start pocketbase.exe serve
```

Double-click to start!

## Next Steps

After setting up PocketBase, you'll need to update your code to use PocketBase's REST API instead of Firebase. But for now, you can use the web UI to manage your data manually!

