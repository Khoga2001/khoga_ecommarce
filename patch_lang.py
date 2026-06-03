with open('frontend/src/context/LanguageContext.jsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const t = (key) => translations[lang][key] || translations['en'][key] || key;",
    "const t = (key) => (translations[lang] || translations['en'])[key] || translations['en'][key] || key;"
)

with open('frontend/src/context/LanguageContext.jsx', 'w') as f:
    f.write(content)
