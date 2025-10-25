#!/bin/bash

SOURCE_ICON="public/android-chrome-512x512.png"
ANDROID_RES="android/app/src/main/res"

# Icon sizes for different densities
declare -A SIZES=(
    ["mdpi"]="48"
    ["hdpi"]="72"
    ["xhdpi"]="96"
    ["xxhdpi"]="144"
    ["xxxhdpi"]="192"
)

echo "🎨 Generating Android launcher icons from $SOURCE_ICON"

for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
    case $density in
        mdpi) size=48 ;;
        hdpi) size=72 ;;
        xhdpi) size=96 ;;
        xxhdpi) size=144 ;;
        xxxhdpi) size=192 ;;
    esac
    
    output_dir="$ANDROID_RES/mipmap-$density"
    
    echo "  📱 Generating ${density} icons (${size}x${size})"
    
    # Create directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Generate ic_launcher.png with padding (85% of size to avoid cropping)
    padded_size=$((size * 85 / 100))
    sips -z $padded_size $padded_size "$SOURCE_ICON" --out "$output_dir/ic_launcher_temp.png" > /dev/null 2>&1
    
    # Create white background and center the padded icon
    sips -c $size $size "$output_dir/ic_launcher_temp.png" --out "$output_dir/ic_launcher.png" --padColor FFFFFF > /dev/null 2>&1
    rm "$output_dir/ic_launcher_temp.png" 2>/dev/null
    
    # Generate ic_launcher_round.png (same as regular)
    cp "$output_dir/ic_launcher.png" "$output_dir/ic_launcher_round.png"
    
    # Generate ic_launcher_foreground.png (80% of size for adaptive icons with more padding)
    foreground_size=$((size * 80 / 100))
    sips -z $foreground_size $foreground_size "$SOURCE_ICON" --out "$output_dir/ic_launcher_foreground_temp.png" > /dev/null 2>&1
    sips -c $size $size "$output_dir/ic_launcher_foreground_temp.png" --out "$output_dir/ic_launcher_foreground.png" --padColor FFFFFF > /dev/null 2>&1
    rm "$output_dir/ic_launcher_foreground_temp.png" 2>/dev/null
done

echo "✅ All launcher icons generated successfully!"
echo ""
echo "📝 Note: Rebuild the APK to see the new icons"
