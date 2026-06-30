"""Second-round fix for the remaining mojibake."""
import sys

fp = r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx'

with open(fp, 'r', encoding='utf-8') as f:
    text = f.read()

# The remaining broken sequence in line 398 is "Ã¢â€ Â" which should be "← "
TEXT_FIXES = [
    # Try the exact string from line 398
    ('Ã¢â€\xa0Â\x90', '←'),
    ('Ã¢â€ Â', '←'),
    # Em-dash leftover (try various em-dash encodings)
    ('Ã†Ã†â€ Ã†', '—'),
    # Final fixes
    ('Â', ''),  # remove remaining single Â
]

applied = 0
for broken, correct in TEXT_FIXES:
    while broken in text:
        text = text.replace(broken, correct, 1)
        applied += 1

print('Round 2 replacements:', applied)

# Write
with open(fp, 'w', encoding='utf-8') as f:
    f.write(text)
print('Wrote', fp)

# Verify
with open(fp, 'r', encoding='utf-8') as f:
    text2 = f.read()

# Re-check
broken_chars_count = sum(text2.count(c) for c in ['Ã', 'Â'])
print('Remaining Ã/Â:', broken_chars_count)
if broken_chars_count > 0:
    for i, line in enumerate(text2.split('\n')):
        for c in ['Ã', 'Â']:
            if c in line:
                print('L{}: {!r}'.format(i+1, line[:200]))
                break
