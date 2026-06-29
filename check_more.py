with open(r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')
for n in [592, 604, 605, 819]:
    line = lines[n]
    # find first broken byte position
    idx = line.find(b'\xc3')
    if idx == -1: continue
    print('L{}: bytes around break: {}'.format(n+1, line[idx:idx+30].hex()))
    print('  text: {!r}'.format(line[idx:idx+30].decode('utf-8', errors='replace')))