# 🚀 Vibe UI Assistant Extension Installation Guide

## ✅ Extension Built Successfully!

Your Chrome extension is ready for installation. Here's how to install it:

## 📁 Files Location
- **Built Extension**: `/extension/dist/` folder
- **Packaged Extension**: `/extension/vibe-ui-assistant-extension.zip`
- **Web Download**: Available at `http://localhost:3000/install`

## 🔧 Installation Methods

### Method 1: Load Unpacked (Recommended for Development)

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/` in Chrome
   - Enable "Developer mode" (toggle in top right)

2. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to: `/Users/marcus/Desktop/WIP/designtaste/extension/dist`
   - Select the `dist` folder

3. **Verify Installation**
   - You should see "Vibe UI Assistant" in your extensions list
   - The extension icon should appear in your Chrome toolbar

### Method 2: Install from Zip

1. **Download/Extract**
   - Use the zip file: `extension/vibe-ui-assistant-extension.zip`
   - Extract it to a folder

2. **Follow Method 1** using the extracted folder

### Method 3: Web Installation (User-Friendly)

1. **Start Next.js App**
   ```bash
   npm run dev
   ```

2. **Visit Installation Page**
   - Go to: `http://localhost:3000/install`
   - Click "Download Extension"
   - Follow the visual instructions

## 🎯 Testing the Extension

Once installed:

1. **Activate Extension**
   - Visit any website
   - Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac)
   - OR click the extension icon and click "Select Element"

2. **Test Element Selection**
   - You should see a dark overlay appear
   - Hover over elements to see them highlighted
   - Click on any element to see action buttons

3. **Test Queue Functionality**
   - Try "Add to Queue" vs "Process Now"
   - Check the extension popup to see queue status

## 🔗 Next Steps

1. **Start Next.js App** (if not running):
   ```bash
   npm run dev
   ```

2. **Set up Supabase** (optional for now):
   - Create a Supabase project
   - Run the schema from `/supabase/schema.sql`
   - Add environment variables

3. **Test Full Workflow**:
   - Select elements → Add to queue → Check web app dashboard

## 🐛 Troubleshooting

**Extension not loading?**
- Make sure you selected the `dist` folder, not the root `extension` folder
- Check Chrome DevTools console for errors

**No overlay appearing?**
- Check if the extension is enabled in `chrome://extensions/`
- Try refreshing the page after enabling

**API errors?**
- Make sure Next.js dev server is running on `http://localhost:3000`
- Check browser console for network errors

## 📝 Development Notes

- **Rebuild after changes**: `cd extension && npm run build`
- **Auto-rebuild**: `cd extension && npm run dev` (watches for changes)
- **Hot reload**: Chrome will auto-reload the extension when files change in dev mode

You're all set! 🎉