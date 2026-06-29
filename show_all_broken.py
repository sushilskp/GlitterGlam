with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
lines = text.split('\n')
for n in [593, 605, 606, 797, 806, 816, 819, 820, 821]:
    if n <= len(lines):
        line = lines[n-1]
        print('L{}: {}'.format(n, line[:300]))
