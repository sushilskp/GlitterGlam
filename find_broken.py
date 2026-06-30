import os
walked = False
for root, dirs, files in os.walk('src'):
    walked = True
    for fn in files:
        if not (fn.endswith('.tsx') or fn.endswith('.ts')):
            continue
        path = os.path.join(root, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception:
            continue

        broken_patterns = ['Ã¢', 'Â¦', 'Â§', 'â€', 'â„', 'âš', 'Â©', 'Â®', 'âœ', 'Ã¯']
        for i, line in enumerate(text.splitlines()):
            for c in broken_patterns:
                if c in line:
                    print(f"{path}:{i+1}: {line[:250]}")
                    break
