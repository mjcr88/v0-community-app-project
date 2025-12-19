#!/bin/bash
cd /Users/mj/Developer/v0-community-app-project

# Delete story files for deprecated library components
files=(
  "accordion" "alert-dialog" "animated-gradient-text" "avatar-circles" "bento-grid"
  "border-beam" "canvas-fractal-grid" "chart" "checkbox" "command" "context-menu"
  "drawer" "globe" "highlighter" "hover-card" "input-otp" "interactive-hover-button"
  "menubar" "morphing-text" "navigation-menu" "pagination" "popover-form" "ProfileCard"
  "progress" "progressive-blur" "radio-group" "ripple" "ripple-button" "scroll-area"
  "scroll-based-velocity" "scroll-progress" "shiny-button" "sonner" "sparkles-text"
  "table" "text-animate" "textarea" "texture-card" "three-d-carousel" "timer"
  "toggle-group" "tweet-card" "video-text" "warp-background" "privacy-message"
  "profile-hero-section" "profile-info-panels" "filter-card"
)

count=0
for f in "${files[@]}"; do
  if [ -f "components/library/$f.stories.tsx" ]; then
    rm -f "components/library/$f.stories.tsx"
    ((count++))
  fi
done

echo "Deleted $count story files"
echo "Remaining story files: $(find components -name '*.stories.tsx' -not -path '*/_deprecated/*' | wc -l)"
