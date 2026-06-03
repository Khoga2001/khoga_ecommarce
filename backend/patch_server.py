import re

with open('new_equipment.py', 'r') as f:
    new_data = f.read().strip()
    
# remove [ and ] from new_data
new_data = new_data[1:-1].strip()

with open('server.py', 'r') as f:
    content = f.read()

# We want to replace from '{"title": "Moka pot",' down to the end of the products list.
# The list ends at ']'
pattern = r'(\{"title": "Moka pot", "handle": "moka-pot",.*?)\n    \]'
replacement = new_data + '\n    ]'

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('server.py', 'w') as f:
    f.write(new_content)
    
print("server.py patched!")
