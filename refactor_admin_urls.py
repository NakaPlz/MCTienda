
import os
import re

ADMIN_DIR = r'C:\Users\Juan\Desktop\Codigo\TiendaMuyCriollo\admin\app'

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for hardcoded URLs
    if 'http://localhost:8000' not in content and 'http://127.0.0.1:8000' not in content:
        return

    print(f"Refactoring {filepath}...")

    # Add import if not present
    if "import { API_URL } from '@/lib/api';" not in content:
        # Insert after last import or at top
        lines = content.splitlines()
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.startswith('import ') or line.startswith("'use client'"):
                last_import_idx = i
        
        insert_idx = last_import_idx + 1 if last_import_idx != -1 else 0
        lines.insert(insert_idx, "import { API_URL } from '@/lib/api';")
        content = '\n'.join(lines)

    # Replacements
    # 1. Replace `http://...` strings inside backticks
    # Regex for `http://localhost:8000...`
    # We want to replace `http://localhost:8000` with ${API_URL}
    
    # Handle single/double quotes first: convert to backticks if they contain the URL
    # pattern: 'http://localhost:8000/...' -> `${API_URL}/...`
    
    def replace_match(match):
        url = match.group(0)
        # remove quotes
        quote = url[0]
        inner = url[1:-1]
        
        inner = inner.replace('http://localhost:8000', '${API_URL}')
        inner = inner.replace('http://127.0.0.1:8000', '${API_URL}')
        
        return f'`{inner}`'

    # Replace quoted strings containing the URL
    content = re.sub(r"['\"]http://(?:localhost|127\.0\.0\.1):8000[^'\"]*['\"]", replace_match, content)

    # Now handle existing backticks
    # pattern: `http://localhost:8000...` -> `${API_URL}...`
    content = content.replace('http://localhost:8000', '${API_URL}')
    content = content.replace('http://127.0.0.1:8000', '${API_URL}')
    
    # Fix potential double ${API_URL} if I messed up replacement order?
    # No, because I replaced http... with ${API_URL}.
    # But wait, if it was inside backticks already: `http://localhost:8000/foo/${id}`
    # it becomes `${API_URL}/foo/${id}` which is correct.
    
    # If it was inside quotes: 'http://localhost:8000/foo'
    # My regex converted it to `${API_URL}/foo` (backticks included)
    
    # Edge case: existing backticks replacement done globally might affect the ones I just converted?
    # No, because I constructed the replacement string with backticks.
    
    # Wait, the global replace at the end:
    # content = content.replace('http://localhost:8000', '${API_URL}')
    # This acts on everything.
    # If I had `http://localhost:8000` inside a backtick string, it becomes `${API_URL}`. Correct.
    # If I had 'http://localhost:8000' (quotes), I already converted it to `${API_URL}` via regex.
    # So the global replace logic is redundant for quotes but necessary for existing backticks if I didn't include them in regex.
    
    # Let's verify the regex logic again.
    # re.sub finds 'http://localhost:8000/foo' and replaces with `${API_URL}/foo`
    # The content now has backticks.
    
    # What if I have `const res = await fetch('http://localhost:8000/foo');`
    # Becomes `const res = await fetch(`${API_URL}/foo`);`
    
    # Content is fine.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(ADMIN_DIR):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            refactor_file(os.path.join(root, file))

print("Refactoring complete.")
