#!/usr/bin/env python3
"""
Comprehensive unused component finder.
Checks for both absolute (@/components/...) and relative (./...) imports.
"""

import os
import re
import sys
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path("/Users/mj/Developer/v0-community-app-project")
COMPONENTS_DIR = PROJECT_ROOT / "components"

# Folders to scan
COMPONENT_FOLDERS = [
    "announcements",
    "check-ins", 
    "dashboard",
    "directory",
    "ecovilla/dashboard",
    "ecovilla/navigation",
    "event-forms",
    "events",
    "exchange",
    "exchange/create-listing-steps",
    "feedback",
    "library",
    "locations",
    "map",
    "notifications",
    "onboarding",
    "onboarding/steps",
    "profile",
    "requests",
    "settings",
    "shared",
    "transactions",
    "ui",
    "userjot",
]

def get_all_source_files():
    """Get all .tsx and .ts files in the project (excluding node_modules, .next)"""
    files = []
    exclude_dirs = {'node_modules', '.next', '.git', 'storybook-static'}
    
    for root, dirs, filenames in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for filename in filenames:
            if filename.endswith(('.tsx', '.ts')) and not filename.endswith('.d.ts'):
                files.append(Path(root) / filename)
    return files

def read_file_content(filepath):
    """Read file content, return empty string on error"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return ""

def is_component_used(component_name, folder, all_files, component_file):
    """
    Check if a component is imported anywhere.
    Checks for:
    - @/components/folder/component
    - "./component" (relative import within same folder)
    - "../component" variations
    """
    # Patterns to match
    abs_pattern = f'@/components/{folder}/{component_name}'
    rel_pattern_dot = f'from "./{component_name}"'
    rel_pattern_single = f"from './{component_name}'"
    
    # For nested folders like ecovilla/dashboard
    folder_parts = folder.split('/')
    if len(folder_parts) > 1:
        parent_rel = f'from "./{folder_parts[-1]}/{component_name}"'
    else:
        parent_rel = None
    
    for source_file in all_files:
        # Skip the component file itself
        if source_file.resolve() == component_file.resolve():
            continue
        
        # Skip story files when checking usage
        if '.stories.' in str(source_file):
            continue
            
        content = read_file_content(source_file)
        
        # Check absolute import
        if abs_pattern in content:
            return True
        
        # Check relative imports (only for files in same or parent folder)
        source_folder = source_file.parent
        component_folder = component_file.parent
        
        if source_folder == component_folder:
            if rel_pattern_dot in content or rel_pattern_single in content:
                return True
        
        # Check parent folder imports
        if parent_rel and parent_rel in content:
            return True
    
    return False

def main():
    print("=" * 60)
    print("COMPREHENSIVE UNUSED COMPONENT ANALYSIS")
    print("Checking both absolute and relative imports...")
    print("=" * 60)
    print()
    
    # Get all source files once
    print("Scanning project files...")
    all_files = get_all_source_files()
    print(f"Found {len(all_files)} source files")
    print()
    
    unused_by_folder = defaultdict(list)
    total_checked = 0
    total_unused = 0
    
    for folder in COMPONENT_FOLDERS:
        folder_path = COMPONENTS_DIR / folder
        if not folder_path.exists():
            continue
        
        tsx_files = list(folder_path.glob("*.tsx"))
        
        for component_file in tsx_files:
            component_name = component_file.stem
            
            # Skip story files and decorators
            if '.stories' in component_name:
                continue
            if 'decorator' in component_name.lower():
                continue
            
            total_checked += 1
            
            if not is_component_used(component_name, folder, all_files, component_file):
                unused_by_folder[folder].append(component_name)
                total_unused += 1
    
    # Also check root-level components
    for component_file in COMPONENTS_DIR.glob("*.tsx"):
        component_name = component_file.stem
        if '.stories' in component_name:
            continue
        
        total_checked += 1
        abs_pattern = f'@/components/{component_name}'
        
        used = False
        for source_file in all_files:
            if source_file.resolve() == component_file.resolve():
                continue
            content = read_file_content(source_file)
            if abs_pattern in content:
                used = True
                break
        
        if not used:
            unused_by_folder["(root)"].append(component_name)
            total_unused += 1
    
    # Print results
    print("=" * 60)
    print("RESULTS")
    print("=" * 60)
    print()
    
    for folder in sorted(unused_by_folder.keys()):
        components = unused_by_folder[folder]
        if components:
            print(f"### {folder}/ ({len(components)} unused)")
            for comp in sorted(components):
                print(f"  - {comp}")
            print()
    
    print("=" * 60)
    print(f"SUMMARY: {total_unused} unused out of {total_checked} components checked")
    print("=" * 60)

if __name__ == "__main__":
    main()
