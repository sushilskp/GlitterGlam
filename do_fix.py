"""Fix mojibake in src/App.tsx by patching specific byte sequences."""
import os
import sys

fp = r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx'

with open(fp, 'r', encoding='utf-8') as f:
    text = f.read()

# Use byte-level replacement because the UTF-8 text has the right byte patterns
TEXT_FIXES = [
    # Heart icons (admin header)
    ('Ã¢Å¡â„¢Ã¯Â¸Â\x8f', '♥'),
    ('Ã¢Å¡â„¢Ã¯Â¸Â', '♥'),
    # Rupee (multiple encodings)
    ('Ã‚Â¹', '₹'),
    ('Ã‹â€¡', '₹'),
    ('Ã‹â€ ¹', '₹'),
    ('Ã†Ë†', '₹'),
    # Black four-pointed star (section decoration)
    ('Ã¢Å“Â¦', '✦'),
    # White four-pointed star (smaller decoration)
    ('Ã¢Å“Â§', '✧'),
    # Back arrow (left arrow)
    ('Ã¯Â¸Â Ã¢', '← '),
    ('Ã¢Å“ Â', '←'),
    # Em dash
    ('Ã¯Â¸â€ Ã', '—'),
    ('Ã†â€ Ã†', '—'),
    ('Ã†Ã†â€ Ã†', '—'),
    ('Ã†â€ Ã', '—'),
    # Hearts and various other fragments
    ('Ã¯Â¸Â', ''),
    ('Ãƒâ‚¬', '"'),
    # Ã¢ / Â cleanup (these are safe to remove as long as the surrounding context is correct)
    ('Â°', '°'),
    ('Â ', ' '),
]

applied = 0
for broken, correct in TEXT_FIXES:
    while broken in text:
        text = text.replace(broken, correct, 1)
        applied += 1

print('Replacements:', applied)

# Write to file
try:
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(text)
    print('Wrote', fp)
except Exception as e:
    print('WRITE ERR:', e)

# Verify
with open(fp, 'r', encoding='utf-8') as f:
    text2 = f.read()

# Check remaining broken chars
broken_chars_count = sum(text2.count(c) for c in ['Ã', 'Â'])
print('Remaining suspicious chars:', broken_chars_count)
if broken_chars_count > 0:
    lines = text2.split('\n')
    for i, line in enumerate(lines):
        for c in ['Ã', 'Â']:
            if c in line:
                print('L{}: {}'.format(i+1, line[:300]))
                break

TEXT_FIXES = [
    # Heart emoji
    ('Ã¢Å¡â„¢Ã¯Â¸Â', '♥'),
    # Rupee
    ('â‚Â¹', '₹'),  # this might be wrong, let me try
    ('Ã‚Â¹', '₹'),
    # Bullet stars in section headers
    ('Ã¢Å“Â¦', '✦'),
    ('Ã¢Å“Â§', '✧'),
    # Em dash
    ('Ã¢â‚¬Â"Â', '—'),
    ('Ã¢â‚¬â€Â', '—'),
    # Back arrow
    ('Ã¢â‚¬Â Â', '←'),
    # Trademark
    ('Ã‚Â¢', '¢'),
    # Misc
    ('Â°', '°'),
    ('Â ', ' '),
]

applied = []
for broken, correct in TEXT_FIXES:
    if broken in text:
        count = text.count(broken)
        text = text.replace(broken, correct)
        applied.append('  {!r} -> {!r} ({}x)'.format(broken, correct, count))

if applied:
    # Try to write - if fails, write to temp file then atomic rename
    try:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(text)
        print('WROTE', fp)
        for a in applied:
            print(a)
    except PermissionError:
        print('PERM ERROR - cannot write', fp)
        # Try writing to a different filename then rename
        alt = fp + '.fixed'
        with open(alt, 'w', encoding='utf-8') as f:
            f.write(text)
        print('WROTE to alt', alt)
else:
    print('No fixes applied - broken text already replaced or pattern mismatch')

# Verify - re-read and check if any broken chars remain
with open(fp, 'r', encoding='utf-8') as f:
    text2 = f.read()

import re
# Find any remaining broken sequences
remaining = []
lines = text2.split('\n')
for i, line in enumerate(lines):
    for c in ['Ã', 'Â']:
        if c in line:
            remaining.append('L{}: {}'.format(i+1, line[:200]))
            break

if remaining:
    print('\nRemaining broken lines:')
    for r in remaining[:20]:
        print(r)
else:
    print('\nNo mojibake remains!')
