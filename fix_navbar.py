import re
with open('frontend/src/components/Navbar.jsx', 'r') as f:
    content = f.read()

# Remove the old toggleLanguage function
content = re.sub(r'const toggleLanguage = \(newLang\) => \{.*?\};\n\n', '', content, flags=re.DOTALL)

old_btn = '''<button
              className="icon-btn desktop-only"
              onClick={() => toggleLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px', padding: '0 8px', width: 'auto' }}
            >
              {i18n.language === 'en' ? 'AR' : 'EN'}
            </button>'''

new_btn = """<div className="lang-switcher desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
  <button
    className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
    onClick={() => setLang('en')}
    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: lang === 'en' ? 'bold' : 'normal', padding: '0 4px', fontSize: '13px' }}
  >
    EN
  </button>
  <span className="lang-divider" style={{ fontSize: '12px', color: '#ccc' }}>|</span>
  <button
    className={`lang-btn ${lang === 'ar' ? 'active' : ''}`}
    onClick={() => setLang('ar')}
    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: lang === 'ar' ? 'bold' : 'normal', padding: '0 4px', fontSize: '13px' }}
  >
    عربي
  </button>
</div>"""

content = content.replace(old_btn, new_btn)
content = content.replace('i18n.language', 'lang')

with open('frontend/src/components/Navbar.jsx', 'w') as f:
    f.write(content)
