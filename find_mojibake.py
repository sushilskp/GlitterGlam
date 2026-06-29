import os

# Mojibake byte sequences start with these UTF-8 prefix bytes that represent Ã Â â etc
# Ã = 0xC3 0x83 -> bytes look like c383 in UTF-8 -> which is Ã itself when double-encoded
# Common mojibake indicators: bytes that include c383 (Ã) or c382 (Â) or e2809c (left quote)
# But these can also appear in regular text. Let's search for patterns:

bad_strings = [
    'Ã¢', 'Â¦', 'Â§', 'Â©', 'Â®',
    'â€', 'âœ', 'â˜', 'â„', 'âš',
    'Ã¯', 'Ã‹',
]

for root, dirs, files in os.walk('src'):
    for fn in files:
        if not fn.endswith(('.tsx', '.ts', '.css', '.html')): continue
        path = os.path.join(root, fn)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception:
            continue
        lines = text.split('\n')
        for i, line in enumerate(lines):
            for pat in bad_strings:
                if pat in line:
                    print('{}:{}: {}'.format(path, i+1, line[:250]))
                    break
