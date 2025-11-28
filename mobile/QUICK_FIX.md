# Quick Fix for PlatformConstants Error

## Step-by-Step Solution

1. **Stop Expo** (Press Ctrl+C in the terminal)

2. **Navigate to mobile folder:**
   ```bash
   cd mobile
   ```

3. **Clear cache and reinstall:**
   ```bash
   # Clear Metro bundler cache
   npx expo start --clear
   ```

   If that doesn't work, do a full clean:
   ```bash
   # Delete node_modules and cache
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Recurse -Force .expo
   npm cache clean --force
   
   # Reinstall everything
   npm install
   npx expo install --fix
   ```

4. **Restart Expo:**
   ```bash
   npm start
   ```

## Why This Happens

The "PlatformConstants" error occurs when:
- Packages aren't properly installed for SDK 54
- Metro bundler cache is stale
- Version mismatches between Expo packages

The `--clear` flag clears the cache, and `expo install --fix` ensures all packages match SDK 54.

