// src/components/LanguageSwitcher.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Define the languages for the toggle
const LANG_EN_CODE = 'en';
const LANG_AR_CODE = 'ar';
const LANG_EN_NAME = 'English';
const LANG_AR_NAME = 'العربية';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  // Determine the current language. i18n.resolvedLanguage gives the language
  // after detection and fallback.
  const currentLangCode = i18n.resolvedLanguage;

  const handleToggleChange = () => {
    const newLang = currentLangCode === LANG_EN_CODE ? LANG_AR_CODE : LANG_EN_CODE;
    i18n.changeLanguage(newLang);
  };

  // Effect to update document lang attribute
  // (and document.body.dir if you ever re-enable automatic RTL/LTR switching)
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    // document.body.dir = i18n.dir(); // Currently commented out as per your request to keep LTR
    
    // Optional: Add a class to the body for language-specific CSS if needed
    document.body.classList.remove(`lang-${LANG_EN_CODE}`, `lang-${LANG_AR_CODE}`);
    if (i18n.language) {
      document.body.classList.add(`lang-${i18n.language}`);
    }

  }, [i18n.language]); // Rerun only when the language detected by i18n actually changes

  const isCurrentLangArabic = currentLangCode === LANG_AR_CODE;
  const currentLanguageDisplayName = isCurrentLangArabic ? LANG_AR_NAME : LANG_EN_NAME;

  // Determine the language to switch to for the title attribute
  const switchToLanguageName = isCurrentLangArabic ? LANG_EN_NAME : LANG_AR_NAME;

  return (
    // Using Bootstrap's form-switch for the toggle and d-flex for alignment
    <div 
      className="form-check form-switch d-flex align-items-center" 
      title={`Switch to ${switchToLanguageName}`} // Tooltip for the whole control
      style={{ paddingLeft: 0 }} // Adjust if default form-check padding is an issue
    >

      <label 
        className="form-check-label text-dark" 
        htmlFor="languageToggleSwitch" // Clicking label also toggles switch
        style={{ cursor: 'pointer', userSelect: 'none'}}
      >
        {currentLanguageDisplayName}
      </label>

      <input
        className="form-check-input ms-2"
        type="checkbox"
        role="switch"
        id="languageToggleSwitch"
        checked={isCurrentLangArabic} // Switch is "on" (checked) if current language is Arabic
        onChange={handleToggleChange}
        style={{ cursor: 'pointer', float: 'none', marginLeft: '0', marginRight: '0.5em' }} // Custom styling for standalone switch
      />
    </div>
  );
};

export default LanguageSwitcher;