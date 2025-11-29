# Debugging in Expo Go

## How to Access Logs in Expo Go

### Method 1: Metro Bundler Terminal (Recommended)
- The logs appear directly in the terminal where you ran `npm start` or `expo start`
- All `console.log()` statements will appear here
- Look for logs starting with emojis like 🚀, 📱, 🔗, ✅, ❌

### Method 2: Shake Device Menu
1. Shake your device (or press `Cmd+D` on iOS simulator, `Cmd+M` on Android emulator)
2. Select "Debug Remote JS"
3. This opens Chrome DevTools where you can see console logs

### Method 3: React Native Debugger
1. Install React Native Debugger
2. Shake device and select "Debug"
3. Open React Native Debugger app
4. View console logs there

## Google OAuth Token Entry (Expo Go)

Since deep links may not work reliably in Expo Go, use the manual token entry:

1. **After selecting Google account:**
   - Browser will show a page with your authentication token
   - Token appears in a text area on that page

2. **Copy the token:**
   - Click "Copy Token" button on the page, OR
   - Manually select and copy the token from the text area

3. **Return to app:**
   - The app should automatically show a token input field
   - If not, look for "Paste OAuth Token" button and tap it

4. **Paste and submit:**
   - Paste the token in the input field
   - Click "Use Token"
   - You should be logged in!

## Common Issues

### Token not showing in browser
- Check the URL - token should be after `?token=`
- Try refreshing the page
- Check browser console (if accessible) for JavaScript errors

### App not showing token input
- After OAuth fails, an alert should appear
- Tap "Got it" to show the token input field
- Or manually tap "Paste OAuth Token" button

### Invalid token error
- Make sure you copied the COMPLETE token (it's very long)
- Don't add or remove any characters
- Try copying again from the browser page

## Testing Deep Links (For Production Builds)

Deep links work better in production builds. To test:
1. Build with EAS: `eas build --platform android --profile development`
2. Install the build on your device
3. Test the OAuth flow - deep links should work automatically

