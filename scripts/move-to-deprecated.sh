#!/bin/bash
# Move all 80 unused components to _deprecated folder

cd /Users/mj/Developer/v0-community-app-project

# Create directory structure
mkdir -p components/_deprecated/{library,map,directory,requests,onboarding/steps,ecovilla/dashboard,ecovilla/navigation,dashboard,notifications,exchange/create-listing-steps,event-forms,ui}

# Library components (49)
for f in accordion alert-dialog animated-gradient-text avatar-circles bento-grid border-beam calendar-07 calendar-12 calendar-31 canvas-fractal-grid carousel chart checkbox command context-menu drawer expandable-screen globe highlighter hover-card input-otp interactive-hover-button menubar morphing-text navigation-menu pagination popover-form ProfileCard progress progressive-blur radio-group ripple ripple-button scroll-area scroll-based-velocity scroll-progress shiny-button sonner sparkles-text table text-animate textarea texture-card three-d-carousel timer toggle-group tweet-card video-text warp-background; do
  [ -f "components/library/$f.tsx" ] && mv "components/library/$f.tsx" components/_deprecated/library/
done

# Map components (8)
for f in community-map MapboxEditorMap location-info-card locations-table mapbox-places-autocomplete polygon polyline resident-locations-table; do
  [ -f "components/map/$f.tsx" ] && mv "components/map/$f.tsx" components/_deprecated/map/
done

# Directory components (3)
for f in PrivacyMessage ProfileHeroSection ProfileInfoPanels; do
  [ -f "components/directory/$f.tsx" ] && mv "components/directory/$f.tsx" components/_deprecated/directory/
done

# Requests components (3)
for f in community-requests-table create-request-button my-requests-table; do
  [ -f "components/requests/$f.tsx" ] && mv "components/requests/$f.tsx" components/_deprecated/requests/
done

# Onboarding components (3 + 1 step)
for f in rio-scene rio-sprite tour-card; do
  [ -f "components/onboarding/$f.tsx" ] && mv "components/onboarding/$f.tsx" components/_deprecated/onboarding/
done
[ -f "components/onboarding/steps/keys-step.tsx" ] && mv "components/onboarding/steps/keys-step.tsx" components/_deprecated/onboarding/steps/

# Ecovilla dashboard (3)
for f in PlaceholderStatCard PriorityListItem ProfileCard; do
  [ -f "components/ecovilla/dashboard/$f.tsx" ] && mv "components/ecovilla/dashboard/$f.tsx" components/_deprecated/ecovilla/dashboard/
done

# Ecovilla navigation (1)
[ -f "components/ecovilla/navigation/create-modal.tsx" ] && mv "components/ecovilla/navigation/create-modal.tsx" components/_deprecated/ecovilla/navigation/

# Dashboard (2)
for f in checkins-count-widget dashboard-section-collapsible; do
  [ -f "components/dashboard/$f.tsx" ] && mv "components/dashboard/$f.tsx" components/_deprecated/dashboard/
done

# Notifications (2)
for f in notification-bell-button notification-preview-popover; do
  [ -f "components/notifications/$f.tsx" ] && mv "components/notifications/$f.tsx" components/_deprecated/notifications/
done

# Exchange (3)
[ -f "components/exchange/my-exchange-listings-widget.tsx" ] && mv "components/exchange/my-exchange-listings-widget.tsx" components/_deprecated/exchange/
for f in step-2-details-pricing step-3-location-visibility; do
  [ -f "components/exchange/create-listing-steps/$f.tsx" ] && mv "components/exchange/create-listing-steps/$f.tsx" components/_deprecated/exchange/create-listing-steps/
done

# Event forms (1)
[ -f "components/event-forms/location-map-preview.tsx" ] && mv "components/event-forms/location-map-preview.tsx" components/_deprecated/event-forms/

# UI (1)
[ -f "components/ui/filter-card.tsx" ] && mv "components/ui/filter-card.tsx" components/_deprecated/ui/

echo "Done! Counting moved files:"
find components/_deprecated -name "*.tsx" | wc -l
