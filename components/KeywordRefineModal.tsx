import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyword } from '../types';
import { SparklesIcon } from './icons';
import { Tooltip } from './Tooltip';

export interface KeywordRefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  keywordData: { index: number; value: Keyword } | null;
  onSave: (index: number, newValue: Keyword) => void;
  onRegenerate: (keywordToReplace: string) => Promise<Keyword>;
}

export const KeywordRefineModal: React.FC<KeywordRefineModalProps> = ({
  isOpen,
  onClose,
  keywordData,
  onSave,
  onRegenerate,
}) => {
  const { t } = useTranslation();
  const [currentKeyword, setCurrentKeyword] = useState<Keyword | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (keywordData) {
      setCurrentKeyword(keywordData.value);
      setError(null);
    }
  }, [keywordData]);

  if (!isOpen || !keywordData || !currentKeyword) return null;

  const handleRegenerateClick = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const newKeyword = await onRegenerate(currentKeyword.keyword);
      setCurrentKeyword(newKeyword);
    } catch (err) {
      setError(t('modal.error'));
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveClick = () => {
    onSave(keywordData.index, currentKeyword);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 animate-fadeIn"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md mx-4 transform transition-all duration-300 animate-scaleIn" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('modal.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {t('modal.description')}
        </p>
        <div className="space-y-2">
            <div className="relative">
                <input
                    type="text"
                    value={currentKeyword.keyword}
                    onChange={(e) => setCurrentKeyword({ ...currentKeyword, keyword: e.target.value })}
                    className="w-full p-3 pr-32 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                    aria-label={t('modal.inputLabel')}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Tooltip text={t('tooltip.regenerateKeywordAI')}>
                    <button
                        onClick={handleRegenerateClick}
                        disabled={isRegenerating}
                        className="inline-flex items-center px-3 py-1.5 font-semibold text-sm text-primary dark:text-secondary-light bg-primary-light dark:bg-gray-900 rounded-md hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRegenerating ? (
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ) : (
                        <>
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            {t('modal.regenerate')}
                        </>
                        )}
                    </button>
                    </Tooltip>
                </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-right pr-2">
                {t('common.charLimit', { length: currentKeyword.keyword.length, limit: 20 })}
            </p>
        </div>
        {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}
        <div className="flex justify-end space-x-4 mt-8">
          <Tooltip text={t('tooltip.cancel')}>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </Tooltip>
          <Tooltip text={t('tooltip.saveChanges')}>
            <button
              onClick={handleSaveClick}
              className="px-6 py-2 rounded-lg font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              {t('common.save')}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};