import sys
import os

for root, dirs, files in os.walk('src'):
    for fn in files:
        if not fn.endswith(('.tsx', '.ts', '.css', '.html')): continue
        path = os.path.join(root, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
        except: continue
        lines = text.split('\n')
        for i, line in enumerate(lines):
            for c in ['Ã', 'Â']:
                if c in line:
                    print('{}:{}: {}'.format(path, i+1, line[:200]))
                    break

for fn in os.listdir('.'):
    if not fn.endswith(('.html', '.css', '.md', '.ts')): continue
    if fn in ['package.json', 'tsconfig.json', 'vite.config.ts']: continue
    if fn.startswith(('find', 'fix', 'check', 'inspect', 'show', 'test', 'do_fix', 'all_', 'mojibake', 'inventory', 'run_in_terminal_workdir', 'show_lines')): continue
    try:
        with open(fn, 'r', encoding='utf-8') as f:
            text = f.read()
    except: continue
    lines = text.split('\n')
    for i, line in enumerate(lines):
        for c in ['Ã', 'Â']:
            if c in line:
                print('{}:{}: {}'.format(fn, i+1, line[:200]))
                break

print('---INVENTORY COMPLETE---')
