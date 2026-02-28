import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANG_CYCLE = ['en', 'hi', 'mr'];
const LANG_LABELS = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };
const LANG_NEXT_LABEL = { en: 'हिन्दी', hi: 'मराठी', mr: 'English' };

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentIdx = LANG_CYCLE.indexOf(i18n.language);
    const nextLang = LANG_CYCLE[(currentIdx + 1) % LANG_CYCLE.length];
    i18n.changeLanguage(nextLang);
  };

  const current = LANG_CYCLE.includes(i18n.language) ? i18n.language : 'en';

  return (
    <div className="dash-notify-toggle on" onClick={toggleLanguage} style={{ cursor: 'pointer' }} title={`Switch to ${LANG_NEXT_LABEL[current]}`}>
      <Globe size={16} />
      <span>{LANG_LABELS[current]}</span>
    </div>
  );
};

export default LanguageToggle;
