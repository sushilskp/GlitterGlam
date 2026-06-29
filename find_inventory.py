import os
import sys

out = open('inventory.txt', 'w', encoding='utf-8')

def check(path, text):
    lines = text.split('\n')
    for i, line in enumerate(lines):
        for c in ['Ã', 'Â']:
            if c in line:
                out.write('{}:{}: {}\n'.format(path, i+1, line[:300]))
                break

for root, dirs, files in os.walk('src'):
    for fn in files:
        if not fn.endswith(('.tsx', '.ts', '.css', '.html')): continue
        path = os.path.join(root, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
        except:
            continue
        check(path, text)

for fn in os.listdir('.'):
    if not fn.endswith(('.html', '.css', '.md', '.json', '.ts')): continue
    if fn in ['package.json'] or fn.startswith('find'): continue
    try:
        with open(fn, 'r', encoding='utf-8') as f:
            text = f.read()
    except:
        continue
    check(fn, text)

out.close()
print('saved inventory.txt')
