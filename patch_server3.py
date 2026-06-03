import re

with open('backend/new_equipment.py', 'r') as f:
    new_data = f.read().strip()
    
new_data = new_data[1:-1].strip() + ","

with open('backend/server.py', 'r') as f:
    content = f.read()

start_idx = content.find('{"title": "Moka Pot"')
if start_idx == -1:
    print("Moka pot not found!")
    exit(1)

end_idx = content.find('{"title": "Handheld Milk Frother"')
if end_idx == -1:
    print("Milk frother not found!")
    exit(1)

# Now find the end of the Milk Frother dict, which is the next '},' or ']}'.
end_idx = content.find(']},', end_idx)
if end_idx == -1:
    end_idx = content.find(']}', end_idx) + 2
else:
    end_idx = end_idx + 3

replacement = new_data

new_content = content[:start_idx] + replacement + "\n" + content[end_idx:]

with open('backend/server.py', 'w') as f:
    f.write(new_content)
    
print("server.py patched safely!")
