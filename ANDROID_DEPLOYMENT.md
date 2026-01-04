# Android Play Store Deployment Guide

## Family Economy (Chore Quest) - Technical Deployment Plan

This document provides a complete technical guide for deploying the Family Economy React app to the Google Play Store using Capacitor.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Project Preparation](#phase-1-project-preparation)
4. [Phase 2: Capacitor Setup](#phase-2-capacitor-setup)
5. [Phase 3: Android Configuration](#phase-3-android-configuration)
6. [Phase 4: App Assets](#phase-4-app-assets)
7. [Phase 5: Build Configuration](#phase-5-build-configuration)
8. [Phase 6: Testing](#phase-6-testing)
9. [Phase 7: Play Store Submission](#phase-7-play-store-submission)
10. [Post-Launch Maintenance](#post-launch-maintenance)

---

## Overview

### Why Capacitor?

| Approach | Pros | Cons |
|----------|------|------|
| **Capacitor** (Recommended) | Keeps existing codebase, native APIs, good tooling | Requires Android SDK setup |
| PWA + TWA | No native wrapper needed | Limited native features, Chrome dependency |
| React Native rewrite | Full native experience | Complete rewrite required |

**Decision: Capacitor** - Best balance of effort vs. capability for this React/Vite app.

### App Information

| Field | Value |
|-------|-------|
| App Name | Family Economy |
| Package ID | `com.familyeconomy.chorequest` |
| Version | 1.0.0 |
| Min Android | API 22 (Android 5.1) |
| Target Android | API 34 (Android 14) |

---

## Prerequisites

### Development Machine Requirements

```bash
# Required software
- Node.js 18+ (current: check with `node -v`)
- npm or yarn
- Java JDK 17 (for Android builds)
- Android Studio (latest stable)
- Git
```

### Install Android Studio

1. Download from https://developer.android.com/studio
2. Install with these components:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
3. Open Android Studio → SDK Manager → Install:
   - Android 14 (API 34) SDK Platform
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools
   - Android Emulator

### Set Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### Google Play Developer Account

1. Register at https://play.google.com/console
2. Pay one-time $25 registration fee
3. Complete identity verification (can take 48 hours)

---

## Phase 1: Project Preparation

### 1.1 Update package.json

```json
{
  "name": "family-economy",
  "version": "1.0.0",
  "description": "A family chore management and economy app for kids",
  "author": "Your Name <email@example.com>",
  "license": "UNLICENSED",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "android:init": "npx cap add android",
    "android:sync": "npx cap sync android",
    "android:open": "npx cap open android",
    "android:build": "npm run build && npx cap sync android",
    "android:run": "npx cap run android"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "@capacitor/android": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "@capacitor/cli": "^6.0.0",
    "@capacitor/splash-screen": "^6.0.0",
    "@capacitor/status-bar": "^6.0.0",
    "@capacitor/app": "^6.0.0",
    "vite": "^5.0.10"
  }
}
```

### 1.2 Update vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Important: Use relative paths for Capacitor
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      }
    }
  },
  server: {
    host: true // Allow network access for device testing
  }
})
```

### 1.3 Create Web Manifest (public/manifest.json)

```json
{
  "name": "Family Economy",
  "short_name": "FamilyEcon",
  "description": "Chore management and economy system for families",
  "theme_color": "#1e1b4b",
  "background_color": "#0f172a",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Phase 2: Capacitor Setup

### 2.1 Install Capacitor

```bash
# Install core packages
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init "Family Economy" "com.familyeconomy.chorequest"

# Add Android platform
npm install @capacitor/android
npx cap add android

# Install useful plugins
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app
```

### 2.2 Create capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familyeconomy.chorequest',
  appName: 'Family Economy',
  webDir: 'dist',

  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
    buildOptions: {
      keystorePath: 'keys/release.keystore',
      keystoreAlias: 'familyeconomy',
    }
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    }
  },

  server: {
    // For development only - remove for production
    // url: 'http://192.168.1.100:5173',
    // cleartext: true
  }
};

export default config;
```

### 2.3 Sync and Open Android Project

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## Phase 3: Android Configuration

### 3.1 Update AndroidManifest.xml

Location: `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Feature declarations -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait"
            android:theme="@style/AppTheme.NoActionBar">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 3.2 Update strings.xml

Location: `android/app/src/main/res/values/strings.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Family Economy</string>
    <string name="title_activity_main">Family Economy</string>
    <string name="package_name">com.familyeconomy.chorequest</string>
    <string name="custom_url_scheme">com.familyeconomy.chorequest</string>
</resources>
```

### 3.3 Update styles.xml (Dark Theme)

Location: `android/app/src/main/res/values/styles.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.DarkActionBar">
        <item name="colorPrimary">#6366f1</item>
        <item name="colorPrimaryDark">#1e1b4b</item>
        <item name="colorAccent">#8b5cf6</item>
        <item name="android:windowBackground">#0f172a</item>
        <item name="android:navigationBarColor">#0f172a</item>
        <item name="android:statusBarColor">#0f172a</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="AppTheme">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
    </style>
</resources>
```

### 3.4 Update build.gradle (App Level)

Location: `android/app/build.gradle`

Key settings to verify/update:

```gradle
android {
    namespace "com.familyeconomy.chorequest"
    compileSdk 34

    defaultConfig {
        applicationId "com.familyeconomy.chorequest"
        minSdk 22
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'

            // Signing config (see Phase 5)
            signingConfig signingConfigs.release
        }
    }

    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
```

---

## Phase 4: App Assets

### 4.1 App Icon Requirements

Google Play requires these icon sizes:

| Type | Size | Location |
|------|------|----------|
| Play Store | 512x512 | Upload to Play Console |
| xxxhdpi | 192x192 | `android/app/src/main/res/mipmap-xxxhdpi/` |
| xxhdpi | 144x144 | `android/app/src/main/res/mipmap-xxhdpi/` |
| xhdpi | 96x96 | `android/app/src/main/res/mipmap-xhdpi/` |
| hdpi | 72x72 | `android/app/src/main/res/mipmap-hdpi/` |
| mdpi | 48x48 | `android/app/src/main/res/mipmap-mdpi/` |

### 4.2 Create Icon Files

**Option A: Use Android Asset Studio**
- Visit https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- Upload a 1024x1024 source image
- Download generated assets

**Option B: Capacitor Assets Plugin**

```bash
npm install @capacitor/assets --save-dev

# Create source icon (1024x1024 PNG)
# Place in: resources/icon.png

# Generate all icons
npx capacitor-assets generate
```

### 4.3 Splash Screen

Create splash screen images:

| Density | Size | File |
|---------|------|------|
| xxxhdpi | 1280x1920 | `drawable-xxxhdpi/splash.png` |
| xxhdpi | 960x1440 | `drawable-xxhdpi/splash.png` |
| xhdpi | 640x960 | `drawable-xhdpi/splash.png` |
| hdpi | 480x720 | `drawable-hdpi/splash.png` |
| mdpi | 320x480 | `drawable-mdpi/splash.png` |

### 4.4 Feature Graphic (Play Store)

- Size: 1024 x 500 pixels
- Used for Play Store listing
- Create in design tool (Figma/Canva)

### 4.5 Screenshots (Play Store)

Required:
- Phone: At least 2 screenshots, 1080x1920 or 1920x1080
- 7" Tablet: 1200x1920 (recommended)
- 10" Tablet: 1600x2560 (recommended)

---

## Phase 5: Build Configuration

### 5.1 Generate Release Keystore

```bash
# Create keys directory
mkdir -p android/app/keys

# Generate keystore (SAVE PASSWORD SECURELY!)
keytool -genkey -v -keystore android/app/keys/release.keystore \
  -alias familyeconomy \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Answer prompts:
# - Keystore password: [create strong password]
# - Key password: [same or different strong password]
# - First/Last name: Your Name
# - Organization: Your Organization
# - City, State, Country: Your location
```

**CRITICAL: Backup the keystore file and passwords!**
- Store in secure password manager
- Keep offline backup
- You cannot update your app without this keystore

### 5.2 Create Signing Config

Create `android/app/keystore.properties` (DO NOT COMMIT):

```properties
storeFile=keys/release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=familyeconomy
keyPassword=YOUR_KEY_PASSWORD
```

### 5.3 Update build.gradle for Signing

Add to `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... rest of release config
        }
    }
}
```

### 5.4 Add to .gitignore

```gitignore
# Android signing
android/app/keys/
android/app/keystore.properties
*.keystore
*.jks

# Android build files
android/app/build/
android/.gradle/
android/local.properties
```

### 5.5 Build Release Bundle

```bash
# Sync latest web build
npm run build
npx cap sync android

# Build AAB (Android App Bundle) - recommended for Play Store
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab

# Or build APK for testing
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## Phase 6: Testing

### 6.1 Local Testing

```bash
# Run on connected device or emulator
npx cap run android

# Or open in Android Studio and run
npx cap open android
```

### 6.2 Create Test Checklist

Test all features:

- [ ] App launches correctly with splash screen
- [ ] Pattern lock setup works
- [ ] Pattern lock verification works
- [ ] Chore creation and completion
- [ ] Job creation and completion
- [ ] Balance updates correctly
- [ ] Transaction history displays
- [ ] Spending tool works
- [ ] Sound effects play
- [ ] Money animations work
- [ ] Dark mode displays correctly
- [ ] All modals open/close properly
- [ ] Data persists after app close
- [ ] Back button behavior is correct

### 6.3 Device Testing Matrix

Test on:
- [ ] Android 5.1 (API 22) - minimum supported
- [ ] Android 8 (API 26) - common older device
- [ ] Android 12 (API 31) - recent device
- [ ] Android 14 (API 34) - latest
- [ ] Small screen (5")
- [ ] Large screen (6.5"+)
- [ ] Tablet (optional)

### 6.4 Internal Testing Track

1. Go to Play Console → Your App → Testing → Internal Testing
2. Create new release
3. Upload AAB file
4. Add internal testers (email addresses)
5. Testers receive link to download via Play Store

---

## Phase 7: Play Store Submission

### 7.1 Play Console Setup

1. Go to https://play.google.com/console
2. Create App → Enter details:
   - App name: Family Economy
   - Default language: English (US)
   - App type: App
   - Free or Paid: Free
   - Content rating: Intended for family use

### 7.2 Store Listing

**Main Store Listing:**

| Field | Content |
|-------|---------|
| Title | Family Economy - Chore & Rewards |
| Short description | Help kids learn money management with fun chores and rewards |
| Full description | (See below) |

**Full Description Template:**

```
Family Economy is a fun, engaging way to teach kids about responsibility and money management through a chore and rewards system.

FEATURES:
★ Create and manage daily/weekly chores
★ Track job completions with approval workflow
★ Reward system with virtual currency
★ Parent-controlled pattern lock security
★ Beautiful dark mode interface
★ Transaction history and spending tracking
★ Sound effects and animations
★ Works completely offline

PERFECT FOR:
• Teaching kids responsibility
• Building good habits
• Learning money management
• Family organization

PRIVACY:
All data stays on your device. No accounts required. No data collection.

Get started today and make chores fun!
```

### 7.3 Content Rating

Complete the IARC questionnaire:
- Violence: None
- Sexual content: None
- Language: None
- Controlled substances: None
- User-generated content: None
- In-app purchases: None
- Ads: None

Expected rating: **PEGI 3 / Everyone**

### 7.4 Privacy Policy

Create a privacy policy (required for family apps):

```markdown
# Privacy Policy for Family Economy

Last updated: [Date]

## Data Collection
Family Economy does not collect, store, or transmit any personal data.
All information is stored locally on your device only.

## Data Storage
- Chore and job data is stored in your device's local storage
- Pattern lock information is stored locally and never transmitted
- No accounts or registration required

## Third-Party Services
Family Economy does not use any third-party analytics, advertising,
or tracking services.

## Children's Privacy
This app is designed for family use. We do not knowingly collect
any information from children.

## Contact
For questions about this privacy policy, contact: [your email]
```

Host this at a public URL (GitHub Pages, your website, etc.)

### 7.5 Data Safety Declaration

Fill out the data safety form:

| Question | Answer |
|----------|--------|
| Does your app collect or share any user data? | No |
| Is data encrypted in transit? | N/A (no data transmitted) |
| Can users request data deletion? | N/A (local only) |
| Do you share data with third parties? | No |

### 7.6 App Category

- Category: **Lifestyle** or **Parenting**
- Tags: family, chores, kids, rewards, money management

### 7.7 Pricing & Distribution

- Free
- All countries (or select specific)
- Contains ads: No
- In-app purchases: No

### 7.8 Release Process

1. **Create Production Release**
   - Upload signed AAB
   - Add release notes

2. **Review Checklist**
   - [ ] Store listing complete
   - [ ] Content rating complete
   - [ ] Privacy policy linked
   - [ ] Data safety complete
   - [ ] App content targets verified
   - [ ] Screenshots uploaded

3. **Submit for Review**
   - Initial review: 1-7 days typically
   - Family app review may take longer

---

## Post-Launch Maintenance

### Version Updates

```bash
# Update version in package.json
"version": "1.0.1"

# Update version in capacitor.config.ts or gradle
# android/app/build.gradle:
versionCode 2  # Increment each release
versionName "1.0.1"

# Build and submit
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

### Monitoring

- Check Play Console for crash reports
- Monitor user reviews
- Track install statistics

### Update Cadence

- Bug fixes: As needed
- Feature updates: Monthly/quarterly
- Security updates: Immediately

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build web assets
npx cap sync android          # Sync to Android
npx cap open android          # Open Android Studio
npx cap run android           # Run on device

# Production Build
cd android
./gradlew bundleRelease       # Build AAB for Play Store
./gradlew assembleRelease     # Build APK

# Useful
npx cap doctor                # Check Capacitor setup
adb devices                   # List connected devices
adb logcat                    # View device logs
```

---

## Troubleshooting

### Common Issues

**Build fails with "SDK not found"**
```bash
# Create local.properties in android/
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

**Capacitor sync fails**
```bash
npx cap doctor
npm install
npm run build
npx cap sync android
```

**App crashes on launch**
```bash
# Check logcat for errors
adb logcat | grep -i "familyeconomy"
```

**White screen on app start**
- Verify `base: './'` in vite.config.js
- Check that dist folder has index.html
- Run `npx cap sync android` after building

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Setup & Configuration | 1-2 hours |
| Asset Creation | 2-4 hours |
| Testing | 2-4 hours |
| Play Store Setup | 1-2 hours |
| Review Process | 1-7 days |

**Total: ~1-2 days of work + review time**
