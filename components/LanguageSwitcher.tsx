import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from './Tooltip';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const currentLanguage = i18n.language.startsWith('ar') ? 'ar' : 'en';

  return (
    <div className="flex items-center bg-slate-200 dark:bg-gray-700 rounded-full p-1">
      <Tooltip text={t('tooltip.switchToEnglish')}>
        <button
          onClick={() => handleLanguageChange('en')}
          className={`px-3 py-1 text-sm font-bold rounded-full transition-colors duration-300 ${
            currentLanguage === 'en'
              ? 'bg-white dark:bg-gray-900 text-primary'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          EN
        </button>
      </Tooltip>
      <Tooltip text={t('tooltip.switchToArabic')}>
        <button
          onClick={() => handleLanguageChange('ar')}
          className={`px-3 py-1 text-sm font-bold rounded-full transition-colors duration-300 ${
            currentLanguage === 'ar'
              ? 'bg-white dark:bg-gray-900 text-primary'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          ع
        </button>
      </Tooltip>
    </div>
  );
};
