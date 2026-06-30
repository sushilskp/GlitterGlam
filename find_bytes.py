with open('src/App.tsx', 'rb') as f:
    data = f.read()

lines = data.split(b'\n')
for i, line in enumerate(lines):
    if b'\xc3\xa2' in line or b'\xc3\x82' in line or b'\xc2\xa6' in line or b'\xc2\xa7' in line or b'\xc2\xa9' in line or b'\xc2\xae' in line or b'\xe2\x80' in line:
        try:
            text = line[:120].decode('utf-8', errors='replace')
        except:
            text = '?'
        print(f'L{i+1}: bytes={line[:60].hex()} text={text}')
