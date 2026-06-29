with open('src/App.tsx', 'rb') as f:
    data = f.read()
lines = data.split(b'\n')
for n in [795, 805, 815, 818]:
    line = lines[n]
    print('L{}: {}'.format(n+1, line.decode('utf-8', errors='replace')))
