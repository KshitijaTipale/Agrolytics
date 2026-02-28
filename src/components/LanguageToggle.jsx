import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'mr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="dash-notify-toggle on" onClick={toggleLanguage} style={{ cursor: 'pointer' }}>
      <Globe size={16} />
      <span>{i18n.language === 'mr' ? 'English' : 'मराठी'}</span>
    </div>
  );
};

export default LanguageToggle;
