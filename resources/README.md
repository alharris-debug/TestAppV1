# App Resources

This directory contains source assets for generating app icons and splash screens.

## Icon Generation

### Source File
- `icon-source.svg` - 512x512 SVG source icon

### Option 1: Android Asset Studio (Recommended)
1. Visit https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload a PNG version of `icon-source.svg` (or create your own 1024x1024 PNG)
3. Download the generated icons
4. Copy files to:
   - `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
   - `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
   - `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
   - `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

### Option 2: Capacitor Assets Plugin
```bash
npm install @capacitor/assets --save-dev

# Create 1024x1024 PNG from SVG first, then:
npx capacitor-assets generate --iconBackgroundColor '#1e1b4b'
```

### Option 3: Manual Conversion
Use ImageMagick or similar to convert SVG to required PNG sizes:

```bash
# Install ImageMagick if needed
# Convert SVG to various sizes
convert icon-source.svg -resize 48x48 ../public/icons/icon-48x48.png
convert icon-source.svg -resize 72x72 ../public/icons/icon-72x72.png
convert icon-source.svg -resize 96x96 ../public/icons/icon-96x96.png
convert icon-source.svg -resize 128x128 ../public/icons/icon-128x128.png
convert icon-source.svg -resize 144x144 ../public/icons/icon-144x144.png
convert icon-source.svg -resize 152x152 ../public/icons/icon-152x152.png
convert icon-source.svg -resize 192x192 ../public/icons/icon-192x192.png
convert icon-source.svg -resize 384x384 ../public/icons/icon-384x384.png
convert icon-source.svg -resize 512x512 ../public/icons/icon-512x512.png
```

## Splash Screen

Create a splash screen with:
- Background color: `#0f172a` (slate-900)
- Centered logo
- Recommended sizes:
  - 320x480 (mdpi)
  - 480x720 (hdpi)
  - 640x960 (xhdpi)
  - 960x1440 (xxhdpi)
  - 1280x1920 (xxxhdpi)

## Play Store Assets

Required for Google Play Store submission:

| Asset | Size | Description |
|-------|------|-------------|
| App Icon | 512x512 PNG | High-res icon for store listing |
| Feature Graphic | 1024x500 | Promotional banner |
| Phone Screenshots | 1080x1920 | At least 2 required |
| 7" Tablet Screenshots | 1200x1920 | Recommended |
| 10" Tablet Screenshots | 1600x2560 | Recommended |

## Design Notes

### Color Palette (Dark Mode)
- Background: `#0f172a` (slate-900)
- Primary: `#6366f1` (indigo-500)
- Accent: `#8b5cf6` (violet-500)
- Success: `#22c55e` (green-500)
- Warning: `#fbbf24` (amber-400)
- Surface: `#1e1b4b` (indigo-950)

### Fonts
- Primary: Fredoka (400, 600, 700)
- Accent: Cinzel (600, 700, 900)
