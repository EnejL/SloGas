#!/bin/bash

# SloGas Splash Screen Update Script
# This script updates the splash screen image across all platforms

echo "🎨 Updating SloGas splash screen..."

# Check if the main splash screen image exists
if [ ! -f "assets/splashscreen.png" ]; then
    echo "❌ Error: assets/splashscreen.png not found!"
    echo "Please make sure you have placed your new splash screen image at assets/splashscreen.png"
    exit 1
fi

echo "✅ Found splash screen image at assets/splashscreen.png"

# Update iOS splash screen
echo "📱 Updating iOS splash screen..."
if [ -d "ios/SloGas/Images.xcassets/SplashScreenLogo.imageset" ]; then
    cp assets/splashscreen.png ios/SloGas/Images.xcassets/SplashScreenLogo.imageset/splashscreen.png
    echo "✅ iOS splash screen updated"
else
    echo "❌ iOS imageset directory not found"
fi

# Update Android splash screen (all density folders)
echo "🤖 Updating Android splash screen..."
android_dirs=("drawable-hdpi" "drawable-mdpi" "drawable-xhdpi" "drawable-xxhdpi" "drawable-xxxhdpi")

for dir in "${android_dirs[@]}"; do
    if [ -d "android/app/src/main/res/$dir" ]; then
        cp assets/splashscreen.png "android/app/src/main/res/$dir/splashscreen_logo.png"
        echo "✅ Android $dir updated"
    else
        echo "⚠️  Android $dir directory not found"
    fi
done

echo ""
echo "🎉 Splash screen update complete!"
echo ""
echo "📋 Next steps:"
echo "1. Clean and rebuild your project:"
echo "   - For iOS: expo run:ios"
echo "   - For Android: expo run:android"
echo "2. Or if using Expo Go, the splash screen will update automatically"
echo ""
echo "💡 To update the splash screen again in the future:"
echo "   1. Replace assets/splashscreen.png with your new image"
echo "   2. Run: ./update-splash.sh"
