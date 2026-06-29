"""Round 3 fix: remaining rupee and em-dash."""
fp = r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx'

with open(fp, 'r', encoding='utf-8') as f:
    text = f.read()

# Find the exact broken text
# The text "Ã¢â€š¹" is what the broken sequence displays as - 6 chars
# But it might also be displayed as "Ã†â€šÃ‹â€" (longer)
# Let me try a few
FIXES = [
    # Em-dash in line 820
    ('Ã¢â‚¬â€¢', '—'),  # one of the em-dash forms
    # Rupee forms (multiple encodings)
    ('Ã†Ã‹â€¡', '₹'),  # double-encoded rupee form 1
    ('Ã†Ã‹Ã†â€šÃ‹â€', '₹'),
    ('Ã†Å¡Ã†Ã‹â€', '₹'),
    # Try simpler ones
    ('Ã†Ã†Å¡Ã†', '₹'),
    # Cleanup
    ('Ã†â€šÃ†', ''),
]

applied = 0
for broken, correct in FIXES:
    while broken in text:
        text = text.replace(broken, correct, 1)
        applied += 1
        print('  Replaced {!r} -> {!r}'.format(broken, correct))

print('Round 3 replacements:', applied)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(text)

# Verify
with open(fp, 'r', encoding='utf-8') as f:
    text2 = f.read()

remaining = sum(text2.count(c) for c in ['Ã', 'Â'])
print('Remaining Ã/Â:', remaining)
if remaining > 0:
    for i, line in enumerate(text2.split('\n')):
        for c in ['Ã', 'Â']:
            if c in line:
                print('L{}: {!r}'.format(i+1, line[:200]))
                break