#!/usr/bin/env python3

import os
import re
import glob

def clean_console_logs(file_path):
    """Remove console.log statements from a file, keeping only critical ones"""

    with open(file_path, 'r') as f:
        lines = f.readlines()

    modified = False
    new_lines = []

    # Patterns to keep (wrapped in dev check)
    keep_patterns = [
        r'console\.error',
        r'console\.warn',
        r'Service (loaded|initialized)',
        r'API endpoint',
        r'Yahoo Finance.*loaded',
        r'Alpaca.*initialized'
    ]

    for line in lines:
        # Check if line contains console.log
        if 'console.log' in line or 'console.debug' in line or 'console.info' in line:
            # Check if it's a critical log to keep
            should_keep = any(re.search(pattern, line, re.IGNORECASE) for pattern in keep_patterns)

            if should_keep:
                # Keep but wrap in dev check if not already
                if 'NODE_ENV' not in line:
                    # Simple check - just comment it out for now
                    new_lines.append(f'// {line}' if not line.strip().startswith('//') else line)
                else:
                    new_lines.append(line)
            else:
                # Remove the line (replace with empty)
                modified = True
                # Skip this line
                continue
        else:
            new_lines.append(line)

    if modified:
        with open(file_path, 'w') as f:
            f.writelines(new_lines)
        return True

    return False

def main():
    print("🧹 Cleaning console.log statements...\n")

    # Find all JS/JSX files
    patterns = [
        'src/**/*.js',
        'src/**/*.jsx',
        'api/**/*.js'
    ]

    total_files = 0
    modified_files = 0

    for pattern in patterns:
        files = glob.glob(pattern, recursive=True)
        for file_path in files:
            if 'node_modules' in file_path or 'dist' in file_path:
                continue

            total_files += 1
            if clean_console_logs(file_path):
                modified_files += 1
                print(f"✅ Cleaned: {file_path}")

    print(f"\n✨ Complete! Processed {total_files} files, modified {modified_files} files.")

if __name__ == "__main__":
    main()