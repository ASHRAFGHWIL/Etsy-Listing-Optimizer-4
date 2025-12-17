import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListingData, GroundingChunk, Keyword, ChecklistItem } from './types';
import { generateListing, regenerateKeyword, generateAlternativeTitles, generateAlternativeCategories, generateAltText, generateSeasonalKeywords } from './services/geminiService';
import { SunIcon, MoonIcon, SparklesIcon, PencilIcon, ImageIcon, TrashIcon, LinkIcon, InfoIcon, TrendingUpIcon, TagIcon, CheckIcon } from './components/icons';
import { CopyButton } from './components/CopyButton';
import { KeywordRefineModal } from './components/KeywordRefineModal';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Tooltip } from './components/Tooltip';

interface ImageData {
  id: number;
  file: File;
  base64: string;
}

interface AltTextData {
  id: number;
  text: string;
}

type KeywordVolume = 'All' | 'High' | 'Medium' | 'Low';
const VISIBLE_TITLE_LENGTH = 40;

const Favicon: React.FC<{ source: GroundingChunk }> = ({ source }) => {
  const [error, setError] = useState(false);

  const hostname = useMemo(() => {
    try {
      return new URL(source.web.uri).hostname;
    } catch {
      return null;
    }
  }, [source.web.uri]);

  if (!hostname) {
    return (
      <Tooltip text={source.web.title || 'Invalid Source'} position="top">
        <div className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-gray-700 rounded-lg shadow-sm">
          <LinkIcon className="w-5 h-5 text-slate-400" />
        </div>
      </Tooltip>
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`;

  return (
    <Tooltip text={source.web.title || hostname} position="top">
      <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-gray-700 rounded-lg shadow-sm">
        {error ? (
          <LinkIcon className="w-5 h-5 text-slate-400" />
        ) : (
          <img
            src={faviconUrl}
            alt={hostname}
            className="w-6 h-6"
            onError={() => setError(true)}
          />
        )}
      </a>
    </Tooltip>
  );
};

const ChecklistCard: React.FC<{ checklist: ChecklistItem[] }> = ({ checklist }) => {
  const { t } = useTranslation();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const progress = Math.round((checkedItems.size / checklist.length) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full border-l-4 border-primary">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.checklist.title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('results.checklist.description')}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{progress}%</span>
          <p className="text-xs text-slate-400">{t('results.checklist.completed')}</p>
        </div>
      </div>
      
      <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
        <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="space-y-3">
        {checklist.map((item, index) => {
          const isChecked = checkedItems.has(index);
          return (
            <div 
              key={index} 
              onClick={() => toggleItem(index)}
              className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors border ${
                isChecked 
                  ? 'bg-primary/5 border-primary/20 dark:bg-primary/10' 
                  : 'bg-slate-50 border-slate-100 dark:bg-gray-700 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 mr-3 ml-1 flex items-center justify-center rounded border transition-colors mt-0.5 ${
                isChecked 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-500'
              }`}>
                {isChecked && <CheckIcon className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-secondary-dark dark:text-secondary-light uppercase tracking-wide block mb-1">
                  {item.element}
                </span>
                <p className={`text-sm ${isChecked ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.instruction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const [priorityKeyword, setPriorityKeyword] = useState('');
  const [purchaseIntent, setPurchaseIntent] = useState('');
  const [geography, setGeography] = useState('');
  const [listingData, setListingData] = useState<ListingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [images, setImages] = useState<ImageData[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isFetchingFromUrls, setIsFetchingFromUrls] = useState(false);

  const [altTexts, setAltTexts] = useState<AltTextData[]>([]);
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
  
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const [alternativeTitles, setAlternativeTitles] = useState<string[]>([]);
  const [alternativeCategories, setAlternativeCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingKeyword, setEditingKeyword] = useState<{ index: number; value: Keyword } | null>(null);
  const [keywordFilter, setKeywordFilter] = useState<KeywordVolume>('All');
  
  const [seasonalKeywords, setSeasonalKeywords] = useState<string[]>([]);
  const [isGeneratingSeasonal, setIsGeneratingSeasonal] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const currentLang = i18n.language;
    const dir = currentLang.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = dir;
  }, [i18n.language]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImageFiles = [...files];
    const totalImages = images.length + newImageFiles.length;

    if (totalImages > 20) {
      setError(t('form.error.imageLimit', { limit: 20 }));
      if (e.target) e.target.value = '';
      return;
    }
    setError(null);

    newImageFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setImages(prevImages => [
            ...prevImages,
            {
              id: Date.now() + Math.random(),
              file,
              base64: base64String,
            }
          ]);
        };
        reader.readAsDataURL(file);
      }
    });

    if (e.target) e.target.value = '';
  };

  const handleFetchImagesFromUrls = async () => {
    const urls = imageUrlInput.split('\n').map(url => url.trim()).filter(url => url);
    if (urls.length === 0) {
        setError(t('form.error.noUrls'));
        return;
    }

    const totalImages = images.length + urls.length;
    if (totalImages > 20) {
        setError(t('form.error.imageLimit', { limit: 20 }));
        return;
    }

    setIsFetchingFromUrls(true);
    setError(null);

    const imagePromises = urls.map(async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image from ${url}. Status: ${response.status}`);
            }
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error(`URL did not point to a valid image: ${url}`);
            }
            const filename = url.substring(url.lastIndexOf('/') + 1) || 'image.jpg';
            const file = new File([blob], filename, { type: blob.type });

            return new Promise<ImageData>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve({
                        id: Date.now() + Math.random(),
                        file,
                        base64: base64String,
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } catch (err) {
            console.error(err);
            return null;
        }
    });

    const results = await Promise.all(imagePromises);
    const newImages = results.filter((result): result is ImageData => result !== null);

    if (newImages.length < urls.length) {
        setError(t('form.error.someUrlsFailed'));
    }

    setImages(prevImages => [...prevImages, ...newImages]);
    setImageUrlInput('');
    setIsFetchingFromUrls(false);
  };

  const removeImage = (idToRemove: number) => {
    setImages(prevImages => prevImages.filter(image => image.id !== idToRemove));
    setAltTexts(prevAltTexts => prevAltTexts.filter(alt => alt.id !== idToRemove));
  };

  const handleGenerateSeasonalKeywords = async () => {
    if (!productDescription.trim()) {
      setError(t('form.error.empty'));
      return;
    }
    
    setIsGeneratingSeasonal(true);
    setSeasonalKeywords([]);
    try {
      const keywords = await generateSeasonalKeywords(productDescription);
      setSeasonalKeywords(keywords);
    } catch (e) {
      console.error(e);
      // Fail silently for this optional feature
    } finally {
      setIsGeneratingSeasonal(false);
    }
  };

  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      setError(t('form.error.empty'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setListingData(null);
    setAltTexts([]);
    setAlternativeTitles([]);
    setAlternativeCategories([]);
    setImageUrlInput('');
    setKeywordFilter('All');
    try {
      // Pass purchaseIntent and geography to the service function
      const data = await generateListing(productDescription, priorityKeyword, purchaseIntent, geography);
      setListingData(data);

      setIsGeneratingTitles(true);
      setIsGeneratingCategories(true);
      if (images.length > 0) setIsGeneratingAltText(true);

      const altTitlesPromise = generateAlternativeTitles(productDescription, data.title, data.keywords, priorityKeyword);
      const altCategoriesPromise = generateAlternativeCategories(productDescription, data.category, data.keywords);
      const altTextPromises = images.map(image => 
        generateAltText(productDescription, data.keywords, image.base64, image.file.type)
      );
      
      const [titlesResult, categoriesResult, ...altTextsResults] = await Promise.allSettled([
        altTitlesPromise,
        altCategoriesPromise,
        ...altTextPromises,
      ]);

      if (titlesResult.status === 'fulfilled') {
        setAlternativeTitles(titlesResult.value);
      }
      
      if (categoriesResult.status === 'fulfilled') {
        setAlternativeCategories(categoriesResult.value);
      }

      if (altTextsResults.length > 0) {
        const newAltTexts = images.map((image, index) => {
            const result = altTextsResults[index];
            return {
                id: image.id,
                text: result.status === 'fulfilled' ? result.value : t('form.error.altText'),
            };
        });
        setAltTexts(newAltTexts);
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(t('form.error.apiError'));
      } else {
        setError(t('form.error.generic'));
      }
    } finally {
      setIsLoading(false);
      setIsGeneratingTitles(false);
      setIsGeneratingCategories(false);
      setIsGeneratingAltText(false);
    }
  };

  const highlightKeywords = useCallback((text: string, keywords: Keyword[], className: string) => {
    if (!text || !keywords || keywords.length === 0) {
      return text;
    }

    interface Match {
      start: number;
      end: number;
      keyword: string;
    }

    const keywordStrings = keywords.map(k => k.keyword);
    const allMatches: Match[] = [];
    keywordStrings.forEach(keyword => {
      if (!keyword) return;
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const keywordRegex = new RegExp(escapedKeyword, 'gi');
      let matchResult;
      while ((matchResult = keywordRegex.exec(text)) !== null) {
        allMatches.push({
          start: matchResult.index,
          end: keywordRegex.lastIndex,
          keyword: matchResult[0]
        });
      }
    });

    const prioritizedMatches = allMatches.filter(matchA => 
      !allMatches.some(matchB => 
        matchB.keyword.length > matchA.keyword.length &&
        matchB.start <= matchA.start &&
        matchB.end >= matchA.end
      )
    );

    const uniqueMatches = Array.from(
      prioritizedMatches.reduce((map, match) => {
        const key = `${match.start}-${match.end}`;
        if (!map.has(key)) {
          map.set(key, match);
        }
        return map;
      }, new Map<string, Match>()).values()
    );

    uniqueMatches.sort((a, b) => a.start - b.start);

    if (uniqueMatches.length === 0) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    uniqueMatches.forEach((match, i) => {
      if (match.start >= lastIndex) {
        if (match.start > lastIndex) {
          parts.push(text.substring(lastIndex, match.start));
        }
        parts.push(
          <span key={`${match.start}-${i}`} className={`${className} font-semibold`}>
            {match.keyword}
          </span>
        );
        lastIndex = match.end;
      }
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, []);

  const keywordsInTitle = useMemo(() => {
    if (!listingData) return new Set<string>();
    const titleText = listingData.title.toLowerCase();
    const used = new Set<string>();
    listingData.keywords.forEach(kw => {
        if (titleText.includes(kw.keyword.toLowerCase())) {
            used.add(kw.keyword);
        }
    });
    return used;
  }, [listingData]);

  const keywordsInDescription = useMemo(() => {
    if (!listingData) return new Set<string>();
    const descriptionText = listingData.description.toLowerCase();
    const used = new Set<string>();
    listingData.keywords.forEach(kw => {
        if (descriptionText.includes(kw.keyword.toLowerCase())) {
            used.add(kw.keyword);
        }
    });
    return used;
  }, [listingData]);
  
  const handleSelectAlternativeTitle = (newTitle: string) => {
    if (!listingData) return;
    
    const oldTitle = listingData.title;
    const newAlternatives = alternativeTitles.filter(t => t !== newTitle);
    newAlternatives.push(oldTitle);
    
    setAlternativeTitles(newAlternatives);
    setListingData({
      ...listingData,
      title: newTitle,
    });
  };

  const handleSelectAlternativeCategory = (newCategory: string) => {
    if (!listingData) return;
    
    const newAlternatives = alternativeCategories.filter(c => c !== newCategory);
    
    setAlternativeCategories(newAlternatives);
    setListingData({
      ...listingData,
      category: newCategory,
    });
  };

  const handleSaveKeyword = (index: number, newValue: Keyword) => {
    if (!listingData) return;
    const newKeywords = [...listingData.keywords];
    const originalIndex = listingData.keywords.findIndex(kw => kw.keyword === editingKeyword?.value.keyword);

    if(originalIndex !== -1) {
        newKeywords[originalIndex] = newValue;
        setListingData({
        ...listingData,
        keywords: newKeywords,
        });
    }
  };

  const handleRegenerateKeyword = async (keywordToReplace: string): Promise<Keyword> => {
    if (!listingData) {
      throw new Error("Listing data not available.");
    }
    if (!productDescription) {
      throw new Error("Product description is missing.");
    }
    return await regenerateKeyword(productDescription, listingData.keywords, keywordToReplace);
  };

  const filteredKeywords = useMemo(() => {
    if (!listingData?.keywords) return [];
    if (keywordFilter === 'All') return listingData.keywords;
    return listingData.keywords.filter(kw => kw.volume === keywordFilter);
  }, [listingData?.keywords, keywordFilter]);

  const renderResultCard = (title: string, content: string | React.ReactNode, charLimit: number, textToCopy: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('common.charLimit', { length: typeof textToCopy === 'string' ? textToCopy.length : 0, limit: charLimit })}
          </p>
        </div>
        <CopyButton textToCopy={textToCopy} />
      </div>
      <div className="text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );

  const getVolumeBadgeClass = (volume: 'High' | 'Medium' | 'Low') => {
    switch (volume) {
      case 'High': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Low': return 'bg-slate-100 text-slate-800 dark:bg-gray-600 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700';
    }
  };

  const renderOptimizedTitle = (title: string, keywords: Keyword[]) => {
    const hasPriorityKeyword = priorityKeyword && title.toLowerCase().startsWith(priorityKeyword.toLowerCase());
  
    let textToSplit: string;
    let priorityKeywordComponent: React.ReactNode | null = null;
    
    if (hasPriorityKeyword) {
      priorityKeywordComponent = (
        <Tooltip text={t('tooltip.priorityKeyword')}>
          <span className="inline-flex items-center bg-secondary-light dark:bg-green-900 text-secondary-dark dark:text-green-300 font-bold rounded-md px-2 py-1 mr-1.5">
              <TrendingUpIcon className="w-4 h-4 mr-1.5" />
              {priorityKeyword}
          </span>
        </Tooltip>
      );
      textToSplit = title.substring(priorityKeyword.length);
    } else {
      textToSplit = title;
    }
  
    const effectiveVisibleLength = VISIBLE_TITLE_LENGTH - (hasPriorityKeyword ? priorityKeyword.length : 0);
  
    let splitIndex = textToSplit.length;
    if (textToSplit.length > effectiveVisibleLength) {
      const boundary = textToSplit.lastIndexOf(' ', effectiveVisibleLength);
      splitIndex = boundary > 0 ? boundary : (effectiveVisibleLength > 0 ? effectiveVisibleLength : 0);
    }
  
    const visibleString = textToSplit.substring(0, splitIndex);
    const hiddenString = textToSplit.substring(splitIndex);
  
    return (
      <>
        {priorityKeywordComponent}
        {highlightKeywords(visibleString, keywords, 'text-highlight-title dark:text-highlight-title-dark')}
        {hiddenString && <span className="opacity-60">{highlightKeywords(hiddenString, keywords, 'text-highlight-title dark:text-highlight-title-dark')}</span>}
      </>
    );
  };

  const renderKeywordsCard = () => {
    if (!listingData) return null;
    const allKeywordsText = listingData.keywords.map(kw => kw.keyword).join(', ');

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.cardKeywords')}</h3>
          <Tooltip text={t('tooltip.copyAllKeywords')}>
            <CopyButton textToCopy={allKeywordsText} />
          </Tooltip>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-slate-200 dark:border-gray-700 pb-4">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 mr-2">{t('results.filterByVolume')}:</span>
          {(['All', 'High', 'Medium', 'Low'] as const).map(volume => (
              <button
                  key={volume}
                  onClick={() => setKeywordFilter(volume)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors duration-200 ${
                      keywordFilter === volume
                      ? 'bg-primary text-white'
                      : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-gray-600'
                  }`}
              >
                  {t(`results.volumes.${volume.toLowerCase()}` as const)}
              </button>
          ))}
        </div>
        
        <ul className="space-y-3">
          {filteredKeywords.map((item, index) => {
            const originalIndex = listingData.keywords.findIndex(kw => kw.keyword === item.keyword);
            const inTitle = keywordsInTitle.has(item.keyword);
            const inDesc = keywordsInDescription.has(item.keyword);
            let highlightClass = 'text-slate-700 dark:text-slate-300';
            if (inTitle) {
              highlightClass = 'font-semibold text-highlight-title dark:text-highlight-title-dark';
            } else if (inDesc) {
              highlightClass = 'font-semibold text-highlight-desc dark:text-highlight-desc-dark';
            }
            
            return (
              <li key={item.keyword} className="flex justify-between items-center bg-slate-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${getVolumeBadgeClass(item.volume)}`}>
                        {t(`results.volumes.${item.volume.toLowerCase()}` as const)}
                    </span>
                    <span className={`truncate pr-2 ${highlightClass}`}>
                      {item.keyword}
                      <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                        ({item.keyword.length})
                      </span>
                    </span>
                    <Tooltip text={item.reason} position="top">
                      <InfoIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </Tooltip>
                </div>
                <div className="flex-shrink-0">
                  <Tooltip text={t('tooltip.refineKeyword')}>
                    <button
                      onClick={() => setEditingKeyword({ index: originalIndex, value: item })}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light rounded-full hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                      aria-label={t('aria.refine')}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
  
  const renderSimpleListCard = (title: string, items: string[], copyTooltip: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
          <Tooltip text={copyTooltip}>
            <CopyButton textToCopy={items.join(', ')} />
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span key={index} className="bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-3 py-1 rounded-full">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-gray-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 ${i18n.language.startsWith('ar') ? 'font-[Cairo]' : 'font-[Inter]'}`}>
      <header className="py-4 px-4 md:px-8 flex justify-between items-center sticky top-0 bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-8 h-8 text-secondary" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{t('header.title')}</h1>
        </div>
        <div className="flex items-center space-x-1 md:space-x-3">
          <LanguageSwitcher />
          <Tooltip text={t('tooltip.toggleTheme')}>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('header.toggleTheme')}
            >
              {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
          </Tooltip>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 mb-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('form.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{t('form.description')}</p>
            <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder={t('form.placeholder')}
                rows={5}
                className="w-full p-4 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                aria-label={t('form.title')}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('form.priorityKeyword.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('form.priorityKeyword.description')}</p>
                    <input
                        type="text"
                        value={priorityKeyword}
                        onChange={(e) => setPriorityKeyword(e.target.value)}
                        placeholder={t('form.priorityKeyword.placeholder')}
                        className="w-full p-3 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary focus:border-primary transition duration-200"
                        aria-label={t('form.priorityKeyword.title')}
                    />
                    <div className="mt-2">
                        <div className="flex items-center flex-wrap gap-2">
                            <button
                            onClick={handleGenerateSeasonalKeywords}
                            disabled={isGeneratingSeasonal || !productDescription.trim()}
                            className="text-sm font-medium text-secondary-dark dark:text-secondary-light flex items-center hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                            <SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingSeasonal ? 'animate-spin' : ''}`} />
                            {isGeneratingSeasonal ? t('form.seasonalKeywords.loading') : t('form.seasonalKeywords.button')}
                            </button>
                        </div>
                        {seasonalKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 animate-fadeIn">
                            {seasonalKeywords.map((kw, idx) => (
                                <button
                                key={idx}
                                onClick={() => setPriorityKeyword(kw)}
                                className="bg-secondary/10 hover:bg-secondary/20 text-secondary-dark dark:text-secondary-light border border-secondary/30 rounded-full px-3 py-1 text-sm transition-colors"
                                >
                                {kw}
                                </button>
                            ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('form.intent.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('form.intent.description')}</p>
                    <div className="relative">
                        <select
                            value={purchaseIntent}
                            onChange={(e) => setPurchaseIntent(e.target.value)}
                            className="w-full p-3 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 appearance-none cursor-pointer"
                            aria-label={t('form.intent.title')}
                        >
                            <option value="">{t('form.intent.placeholder')}</option>
                            <option value="professionals">{t('form.intent.options.professionals')}</option>
                            <option value="beginners">{t('form.intent.options.beginners')}</option>
                            <option value="handicrafts">{t('form.intent.options.handicrafts')}</option>
                            <option value="children">{t('form.intent.options.children')}</option>
                            <option value="home_decor">{t('form.intent.options.home_decor')}</option>
                            <option value="commercial">{t('form.intent.options.commercial')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none ltr:right-0 rtl:left-0 rtl:right-auto">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{t('form.geography.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('form.geography.description')}</p>
                    <div className="relative">
                        <select
                            value={geography}
                            onChange={(e) => setGeography(e.target.value)}
                            className="w-full p-3 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 appearance-none cursor-pointer"
                            aria-label={t('form.geography.title')}
                        >
                            <option value="">{t('form.geography.placeholder')}</option>
                            <option value="us">{t('form.geography.options.us')}</option>
                            <option value="europe">{t('form.geography.options.europe')}</option>
                            <option value="south_america">{t('form.geography.options.south_america')}</option>
                            <option value="asia">{t('form.geography.options.asia')}</option>
                            <option value="north_africa">{t('form.geography.options.north_africa')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none ltr:right-0 rtl:left-0 rtl:right-auto">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-slate-200 dark:border-gray-700 pt-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('form.imageTitle')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{t('form.imageDescription')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div>
                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImageIcon className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">{t('form.uploadButton')}</span> {t('form.orDrag')}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('form.imageLimitText', { limit: 20 })}</p>
                            </div>
                            <input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                    </div>

                    <div className="flex flex-col h-full">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('form.addFromUrl.title')}</h3>
                        <textarea
                            value={imageUrlInput}
                            onChange={e => setImageUrlInput(e.target.value)}
                            placeholder={t('form.addFromUrl.placeholder')}
                            rows={3}
                            className="w-full p-3 bg-slate-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 flex-grow"
                        />
                        <button
                            onClick={handleFetchImagesFromUrls}
                            disabled={isFetchingFromUrls}
                            className="mt-2 w-full bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                            {isFetchingFromUrls ? t('form.addFromUrl.loading') : t('form.addFromUrl.button')}
                        </button>
                    </div>
                </div>

                {images.length > 0 && (
                    <div className="mt-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {images.map(image => (
                                <div key={image.id} className="relative group aspect-square">
                                    <img src={`data:${image.file.type};base64,${image.base64}`} alt={image.file.name} className="w-full h-full object-cover rounded-lg shadow-md" />
                                    <button onClick={() => removeImage(image.id)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t('form.removeImage')}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-8 border-t border-slate-200 dark:border-gray-700 pt-8 text-center">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    <SparklesIcon className={`w-6 h-6 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? t('form.button.loading') : t('form.button.idle')}
                </button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>

        {isLoading && (
          <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">{t('common.generating')}</p>
          </div>
        )}

        {listingData && (
          <div id="results" className="mt-12 space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-extrabold text-center text-slate-800 dark:text-slate-100">{t('results.title')}</h2>
            
            {listingData.checklist && listingData.checklist.length > 0 && (
              <ChecklistCard checklist={listingData.checklist} />
            )}
            
            {renderResultCard(
                t('results.cardTitle'), 
                <div className="text-lg">
                  {renderOptimizedTitle(listingData.title, listingData.keywords)}
                  <Tooltip text={t('tooltip.etsyTitleStrategy')} position="bottom">
                    <InfoIcon className="inline-block w-4 h-4 ml-2 text-slate-400 cursor-help" />
                  </Tooltip>
                </div>,
                140, 
                listingData.title
            )}

            {renderResultCard(
                t('results.cardDescription'),
                highlightKeywords(listingData.description, listingData.keywords, 'text-highlight-desc dark:text-highlight-desc-dark'),
                1000,
                listingData.description
            )}

            {alternativeTitles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">{t('results.altTitles')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alternativeTitles.map((title, index) => (
                    <button key={index} onClick={() => handleSelectAlternativeTitle(title)} className="text-left p-4 bg-slate-50 dark:bg-gray-700 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors">
                      {renderOptimizedTitle(title, listingData.keywords)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isGeneratingTitles && !alternativeTitles.length && <div className="text-center text-slate-500">{t('results.loadingAltTitles')}</div>}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.cardCategory')}</h3>
                <CopyButton textToCopy={listingData.category} />
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-gray-700 inline-block px-3 py-1 rounded-full">
                {listingData.category}
              </div>

              {alternativeCategories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                  <h4 className="font-semibold text-md text-slate-600 dark:text-slate-300 mb-2">{t('results.altCategories')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {alternativeCategories.map((category, index) => (
                      <button key={index} onClick={() => handleSelectAlternativeCategory(category)} className="text-sm px-3 py-1 bg-slate-200 dark:bg-gray-600 rounded-full hover:bg-slate-300 dark:hover:bg-gray-500 transition-colors">
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isGeneratingCategories && !alternativeCategories.length && <div className="text-center text-sm text-slate-500 mt-3">{t('results.loadingAltCategories')}</div>}
            </div>
            
            {renderKeywordsCard()}

            {listingData.keywords?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.cardTags')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {t('results.cardTagsDescription')}
                    </p>
                  </div>
                  <Tooltip text={t('tooltip.copyAllTags')}>
                    <CopyButton textToCopy={listingData.keywords.map(kw => kw.keyword).join(', ')} />
                  </Tooltip>
                </div>
                <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm break-words">
                  {listingData.keywords.map(kw => kw.keyword).join(', ')}
                </div>
              </div>
            )}
            
            {images.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">{t('results.cardAltText')}</h3>
                {isGeneratingAltText && altTexts.length === 0 && <div className="text-center text-slate-500">{t('results.loadingAltText')}</div>}
                <div className="space-y-4">
                  {altTexts.map(({ id, text }) => {
                    const image = images.find(img => img.id === id);
                    if (!image) return null;
                    return (
                      <div key={id} className="flex items-start sm:items-center gap-4 p-3 bg-slate-50 dark:bg-gray-700 rounded-lg flex-col sm:flex-row">
                        <img src={`data:${image.file.type};base64,${image.base64}`} alt={image.file.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow text-sm text-slate-700 dark:text-slate-300">
                          {text}
                        </div>
                        <CopyButton textToCopy={text} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Materials Group */}
              {listingData.materials?.length > 0 && (
                <div className="space-y-8">
                  {/* Materials card */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.cardMaterials')}</h3>
                      <Tooltip text={t('tooltip.copyAllMaterials')}>
                        <CopyButton textToCopy={listingData.materials.join(', ')} />
                      </Tooltip>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {listingData.materials.map((material, index) => (
                        <span key={index} className="bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 text-sm font-medium px-3 py-1 rounded-full">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Materials Tags card */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.cardMaterialsTags')}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {t('results.cardMaterialsTagsDescription')}
                        </p>
                      </div>
                      <Tooltip text={t('tooltip.copyAllMaterialsTags')}>
                        <CopyButton textToCopy={listingData.materials.join(', ')} />
                      </Tooltip>
                    </div>
                    <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm break-words">
                      {listingData.materials.join(', ')}
                    </div>
                  </div>
                </div>
              )}
              
              {listingData.attributes && Object.keys(listingData.attributes).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('results.cardAttributes')}</h3>
                       <Tooltip text={t('tooltip.copyAllAttributes')}>
                           <CopyButton textToCopy={Object.entries(listingData.attributes).map(([key, value]) => `${key}: ${value}`).join('\n')} />
                       </Tooltip>
                   </div>
                   <ul className="space-y-2">
                       {Object.entries(listingData.attributes).map(([key, value]) => (
                           <li key={key} className="flex justify-between text-sm">
                               <span className="font-semibold text-slate-600 dark:text-slate-400">{key}:</span>
                               <span className="text-slate-800 dark:text-slate-200">{value}</span>
                           </li>
                       ))}
                   </ul>
                </div>
              )}
              
              {renderSimpleListCard(t('results.cardColors'), listingData.colors, t('tooltip.copyAllColors'))}
              {renderSimpleListCard(t('results.cardStoreSections'), listingData.storeSections, t('tooltip.copyAllStoreSections'))}
            </div>

            {listingData.pricingSuggestions?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">{t('results.cardPricing')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {listingData.pricingSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-gray-700 rounded-xl p-5 text-center flex flex-col">
                      <h4 className="font-bold text-md text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {t(`results.pricingTiers.${suggestion.tier.toLowerCase()}` as const)}
                      </h4>
                      <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 my-2">
                        ${suggestion.price}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex-grow">
                        {suggestion.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {listingData.sources && listingData.sources.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">{t('results.cardSources')}</h3>
                <div className="flex flex-wrap gap-3">
                  {listingData.sources.map((source, index) => (
                    <Favicon key={index} source={source} />
                  ))}
                </div>
              </div>
            )}
            
             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mt-8">
              <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                <InfoIcon className="w-5 h-5 mr-2" />
                {t('seoNotes.title')}
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  {t('seoNotes.titleLength')}
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  {t('seoNotes.tagLength')}
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  {t('seoNotes.frontLoading')}
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  {t('seoNotes.noRepetition')}
                </li>
              </ul>
            </div>

            <KeywordRefineModal 
              isOpen={!!editingKeyword}
              onClose={() => setEditingKeyword(null)}
              keywordData={editingKeyword}
              onSave={handleSaveKeyword}
              onRegenerate={handleRegenerateKeyword}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;