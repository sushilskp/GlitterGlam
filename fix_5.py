"""Fix with exact Python-read text."""
fp = r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx'

with open(fp, 'rb') as f:
    raw = f.read()

# Find and patch by literal UTF-8 byte sequence
# Rupee broken sequence: c3 83 c2 a2 c3 a2 e2 82 ac c5 a1 c2 b9
rupee_broken = b'\xc3\x83\xc2\xa2\xc3\xa2\xe2\x82\xac\xc5\xa1\xc2\xb9'
rupee_fixed  = '₹'.encode('utf-8')  # e2 82 b9

# Em-dash broken sequence: c3 83 c2 a2 c3 a2 e2 80 9a c2 ac c3 a2 e2 82 ac c2 9d
emdash_broken = b'\xc3\x83\xc2\xa2\xc3\xa2\xe2\x80\x9a\xc2\xac\xc3\xa2\xe2\x82\xac\xc2\x9d'
emdash_fixed  = '—'.encode('utf-8')  # e2 80 94

before = raw
raw = raw.replace(rupee_broken, rupee_fixed)
raw = raw.replace(emdash_broken, emdash_fixed)

rupee_count = before.count(rupee_broken)
emdash_count = before.count(emdash_broken)

print('Rupee replaced:', rupee_count)
print('Em-dash replaced:', emdash_count)

if before != raw:
    with open(fp, 'wb') as f:
        f.write(raw)
    print('Wrote bytes')

# Verify
with open(fp, 'r', encoding='utf-8') as f:
    text = f.read()

remaining = sum(text.count(c) for c in ['Ã', 'Â'])
print('Remaining Ã/Â:', remaining)
if remaining > 0:
    for i, line in enumerate(text.split('\n')):
        for c in ['Ã', 'Â']:
            if c in line:
                print('L{}: {!r}'.format(i+1, line[:200]))
                break
