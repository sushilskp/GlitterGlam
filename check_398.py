with open(r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')
# Find the broken sequence in line 398 (index 397)
line = lines[397]
print('Line 398 (first 100):', line[:100].hex())
print('Line 398 as text:', line[:100].decode('utf-8', errors='replace'))
