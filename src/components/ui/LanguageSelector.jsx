import React, { memo, useCallback } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS } from '../../utils/translations/constants';
import { useTranslation } from '../../utils/translations';
import Button from './Button';

/**
 * Composant de sélection de langue
 * @param {Object} props
 * @param {string} props.variant - Variante d'affichage ('dropdown' | 'button' | 'compact')
 * @param {string} props.position - Position pour le dropdown ('bottom-right' | 'bottom-left' | 'top-right' | 'top-left')
 */
const LanguageSelector = memo(({ variant = 'button', position = 'bottom-right' }) => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleLanguage = useCallback(() => {
    const newLanguage = language === LANGUAGES.FR ? LANGUAGES.EN : LANGUAGES.FR;
    setLanguage(newLanguage);
    setIsOpen(false);
  }, [language, setLanguage]);

  // Variante compacte (icône uniquement)
  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLanguage}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors duration-200 hover:scale-110 w-[44px] h-[44px] flex items-center justify-center flex-shrink-0"
        style={{ willChange: 'transform' }}
        title={language === LANGUAGES.FR ? t('common.ariaLabels.languageSwitch.toEnglish') : t('common.ariaLabels.languageSwitch.toFrench')}
        aria-label={language === LANGUAGES.FR ? t('common.ariaLabels.languageSwitch.toEnglish') : t('common.ariaLabels.languageSwitch.toFrench')}
      >
        <span className="text-white font-semibold text-sm inline-block min-w-[20px] text-center">
          {language.toUpperCase()}
        </span>
      </button>
    );
  }

  // Variante dropdown
  if (variant === 'dropdown') {
    const positionClasses = {
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0'
    };

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200"
          aria-label={t('common.ariaLabels.languageSwitch.selectLanguage')}
        >
          <Languages className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">
            {LANGUAGE_LABELS[language]}
          </span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              className={`absolute ${positionClasses[position]} z-50 mt-2 w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl overflow-hidden`}
            >
              <button
                onClick={() => {
                  setLanguage(LANGUAGES.FR);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-slate-700/50 transition-colors ${
                  language === LANGUAGES.FR ? 'bg-slate-700/30' : ''
                }`}
              >
                <span className="text-white font-medium">Français</span>
                {language === LANGUAGES.FR && (
                  <span className="ml-2 text-green-400">✓</span>
                )}
              </button>
              <button
                onClick={() => {
                  setLanguage(LANGUAGES.EN);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-slate-700/50 transition-colors ${
                  language === LANGUAGES.EN ? 'bg-slate-700/30' : ''
                }`}
              >
                <span className="text-white font-medium">English</span>
                {language === LANGUAGES.EN && (
                  <span className="ml-2 text-green-400">✓</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Variante button (par défaut)
  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Languages className="w-4 h-4" />
      <span>{LANGUAGE_LABELS[language]}</span>
    </Button>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;

