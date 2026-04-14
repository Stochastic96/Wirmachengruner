/**
 * Language and i18n utilities
 */

const LANG_STRINGS = {
  en: {
    'Receipt Vault': 'Receipt Vault',
    'Dashboard': 'Dashboard', 
    'Receipts': 'Receipts',
    'Settings': 'Settings',
  },
  de: {
    'Receipt Vault': 'Belege Tresor',
    'Dashboard': 'Armaturenbrett',
    'Receipts': 'Belege',
    'Settings': 'Einstellungen',
  }
};

function getCurrentLanguage() {
  return document.documentElement.lang || 'en';
}

function setLanguage(lang) {
  if (!['en', 'de'].includes(lang)) lang = 'en';
  
  document.documentElement.lang = lang;
  document.body.setAttribute('data-lang', lang);
  
  // Update language toggle button text
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = lang === 'de' ? '🌐 DE' : '🌐 EN';
  }

  // Save to cookie via API
  fetch('/api/settings/language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: lang }),
  });
}

// Language toggle in header
document.addEventListener('DOMContentLoaded', () => {
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const currentLang = getCurrentLanguage();
      const newLang = currentLang === 'en' ? 'de' : 'en';
      setLanguage(newLang);
    });
  }
});
