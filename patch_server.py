import json, re

with open('seed_data_update.json') as f:
    updates = json.load(f)

with open('backend/server.py') as f:
    content = f.read()

# We can find the # EQUIPMENT block and replace it
def dict_to_py(d):
    s = "{\n"
    s += f"        \"title\": {repr(d['title'])},\n"
    s += f"        \"handle\": {repr(d['handle'])},\n"
    s += f"        \"price\": {d['price']}, \"compare_price\": {d['compare_price']}, \"collection\": \"equipment\", \"stock\": 50,\n"
    
    desc_str = '"""' + d['description'] + '"""'
    s += f"        \"description\": {desc_str},\n"
    if d['variants']:
        s += f"        \"variants\": {repr(d['variants'])},\n"
    s += f"        \"images\": {repr(d['images'])}\n"
    s += "    }"
    return s

new_blocks = []
for handle, data in updates.items():
    data['handle'] = handle
    new_blocks.append(dict_to_py(data))

new_equipment = "        # EQUIPMENT\n        " + ",\n        ".join(new_blocks) + "\n\n    ]"

content = re.sub(r'# EQUIPMENT.*?\]', new_equipment, content, flags=re.DOTALL)

with open('backend/server.py', 'w') as f:
    f.write(content)
print("Updated server.py")
