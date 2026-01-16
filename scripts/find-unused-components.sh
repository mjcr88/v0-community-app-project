#!/bin/bash
# Comprehensive unused component finder
# Checks for both absolute (@/components/...) and relative (./...) imports

cd /Users/mj/Developer/v0-community-app-project

echo "=== COMPREHENSIVE UNUSED COMPONENT ANALYSIS ==="
echo "Checking both absolute and relative imports..."
echo ""

check_component() {
    local file=$1
    local folder=$2
    local basename=$(basename "$file" .tsx)
    
    # Skip story files and decorators
    [[ "$basename" == *".stories"* ]] && return
    [[ "$basename" == *"decorator"* ]] && return
    
    # Count absolute imports from anywhere in codebase (excluding the file itself)
    local abs_count=$(grep -r "@/components/$folder/$basename" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "$file" | wc -l)
    
    # Count relative imports within the same folder (excluding the file itself)  
    local rel_count=$(grep -r "from \"\.\/$basename\"" "components/$folder/" 2>/dev/null | grep -v "$basename.tsx:" | wc -l)
    
    # Also check for relative imports from subfolders (./subfolder/component)
    local subfolder_count=$(grep -r "from \"\./$folder/$basename\"" components/ 2>/dev/null | wc -l)
    
    local total=$((abs_count + rel_count + subfolder_count))
    
    if [ "$total" -eq 0 ]; then
        echo "UNUSED|$folder/$basename|$file"
    fi
}

# Process all component folders
folders=(
    "announcements"
    "check-ins"
    "dashboard"
    "directory"
    "ecovilla/dashboard"
    "ecovilla/navigation"
    "event-forms"
    "events"
    "exchange"
    "exchange/create-listing-steps"
    "feedback"
    "library"
    "locations"
    "map"
    "notifications"
    "onboarding"
    "onboarding/steps"
    "profile"
    "requests"
    "settings"
    "shared"
    "transactions"
    "ui"
    "userjot"
)

for folder in "${folders[@]}"; do
    if [ -d "components/$folder" ]; then
        for file in components/$folder/*.tsx; do
            [ -f "$file" ] || continue
            check_component "$file" "$folder"
        done
    fi
done

# Also check root-level components
for file in components/*.tsx; do
    [ -f "$file" ] || continue
    basename=$(basename "$file" .tsx)
    [[ "$basename" == *".stories"* ]] && continue
    
    abs_count=$(grep -r "@/components/$basename" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "$file" | wc -l)
    
    if [ "$abs_count" -eq 0 ]; then
        echo "UNUSED|root/$basename|$file"
    fi
done
