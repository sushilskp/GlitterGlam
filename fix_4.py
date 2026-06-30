"""Try every combination to fix rupee and em-dash."""
fp = r'C:\Users\dell\OneDrive\Pictures\New folder\remix_-glitter-glam (1)\src\App.tsx'

with open(fp, 'r', encoding='utf-8') as f:
    text = f.read()

# Real broken text in line 593 is "ÃÆâ€šÂ¹" but Python reads "Ã†â€šÅ¡"
# Wait let me read exact bytes
print('L593 raw text:', repr(text.split('\n')[592]))
print()
print('L820 raw text:', repr(text.split('\n')[819]))
