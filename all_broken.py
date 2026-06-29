with open(r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx', 'rb') as f:
    data = f.read()

# Find all byte positions where Ã appears
positions = []
for i in range(len(data)):
    if data[i] == 0xc3 and i+1 < len(data) and data[i+1] == 0x83:
        positions.append(i)

print('Total Ã occurrences:', len(positions))
for p in positions:
    snippet = data[p:p+40].decode('utf-8', errors='replace')
    # find end - next non-broken char
    end = p
    while end < len(data):
        if data[end] < 128:
            # is the next one part of broken? Actually 0xc3 0xa2 is also broken
            if data[end] == 0xc2 and end+1 < len(data):
                # could be broken prefix
                end += 2
                continue
            break
        if data[end] >= 0xc0 and end+1 < len(data) and (data[end+1] & 0xc0) == 0x80:
            end += 2
        else:
            end += 1
    text = data[p:end].decode('utf-8', errors='replace')
    print('@{}, len={}: {!r}'.format(p, end-p, text))
