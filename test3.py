with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
lines = text.split('\n')
print('Total lines:', len(lines))
# Find line with About Glitter Glam
for i, line in enumerate(lines):
    if 'About' in line and 'Glitter Glam' in line:
        print('L{}: {}'.format(i+1, line[:200]))
        print('Contains Ã¢:', 'Ã¢' in line)
