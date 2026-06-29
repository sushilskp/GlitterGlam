"""Fix mojibake (double-encoded UTF-8) in source files.

Pattern: A character like ✦ is UTF-8 encoded as E2 9C A6.
When mistakenly decoded as latin-1 it becomes â¦ (3 chars).
Re-encoded to UTF-8 those 3 chars become C3 A2 C2 A6.
If decoded as latin-1 AGAIN and re-encoded: C3 83 C2 A2 C3 85 E2 80 9C C3 82 C2 A6.

This script decodes the file as UTF-8 (correctly), reverses the double-encoding
by encoding to latin-1 then decoding as UTF-8, then re-encodes as UTF-8 for output.
"""
import os
import sys

# Files to fix
files_to_fix = [
    'src/App.tsx',
    'src/components/AdminPanel.tsx',
    'src/components/ProductCard.tsx',
    'src/components/ProductDetailModal.tsx',
    'src/components/Header.tsx',
    'src/components/Hero.tsx',
    'src/components/AIChatbot.tsx',
    'src/index.css',
    'index.html',
]

# Map of broken string -> correct character
FIXES = {
    # broken -> fixed
    'Ã¢Å"Â¦': '✦',  # four-pointed star (sections)
    'Ã¢Å"Â§': '✧',  # four-pointed star (smaller)
    'Ã¢Å¡â„¢Ã¯Â¸Â': '♥',  # heart (admin header)
    'Ã¢Å¡â„¢Ã¯Â¸Â\u00ff': '♥',  # heart with extra bytes
    'Ã‚Â¦': '|',
    'Ã‚Â§': '§',
    'Ã‚Â©': '©',
    'Ã‚Â®': '®',
    'Ã¢â‚¬Å"': '→',
    'Ã¢â‚¬â„¢': '←',
    'Ã¢Å¡â‚¬': '*',
    'Ã¯Â¸Â': '',  # variation selector stuff
    'Ã‹â€ ¹': '₹',
    'Ã‹â€¡': '₹',
    'Ã…Â': '★',
    'Ã¢Ëœâ€': '✱',
    'Ã°Å¸â€™Â': '',
    'â€"': '—',
    'â€™': "'",
    'â€œ': '"',
    'â€\x9d': '"',
    'â€¦': '…',
    'Ã°Å¸Â"Â': '',
    'Ã°Å¸â€˜â€¢': '',
    'Ã°Å¸Â¥Âº': '',
}

for fp in files_to_fix:
    if not os.path.exists(fp):
        continue
    with open(fp, 'r', encoding='utf-8') as f:
        original = f.read()

    fixed = original
    for broken, correct in FIXES.items():
        if broken in fixed:
            count = fixed.count(broken)
            fixed = fixed.replace(broken, correct)
            print(f'{fp}: replaced {count}x {broken!r} -> {correct!r}')

    if fixed != original:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f'{fp}: SAVED')

print('---DONE---')
