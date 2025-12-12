import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyIcon, CheckIcon } from './icons';
import { Tooltip } from './Tooltip';

interface CopyButtonProps {
  textToCopy: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }, [textToCopy]);

  return (
    <Tooltip text={t('tooltip.copy')}>
      <button
        onClick={handleCopy}
        className={`p-2 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary-dark ${
          isCopied 
          ? 'bg-secondary text-white' 
          : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'
        }`}
        aria-label={t('aria.copy')}
      >
        {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
      </button>
    </Tooltip>
  );
};
