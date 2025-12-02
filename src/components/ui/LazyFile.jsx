/**
 * Composant LazyFile - Charge les fichiers à la demande avec IntersectionObserver
 * Optimise les performances en ne chargeant que les fichiers visibles
 */

import React, { useState, useEffect, useRef } from 'react';

const LazyFile = ({
  file,
  index,
  onDelete,
  onAccess,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant que l'élément soit visible
        threshold: 0.1,
      }
    );

    if (fileRef.current) {
      observer.observe(fileRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Charger le fichier quand il devient visible
  useEffect(() => {
    if (isVisible && !file.url && !isLoading && !error) {
      setIsLoading(true);
      
      // Simuler le chargement (dans un vrai cas, on pourrait charger depuis un serveur)
      // Pour l'instant, on génère juste une URL locale
      setTimeout(() => {
        if (file instanceof File) {
          // Créer une URL locale pour le fichier
          const url = URL.createObjectURL(file);
          setIsLoading(false);
          // Note: Dans un vrai cas, on devrait stocker cette URL dans le state parent
        } else {
          setIsLoading(false);
        }
      }, 100);
    }
  }, [isVisible, file, isLoading, error]);

  const fileName = file.name || file.fileName || 'UNNAMED ASSET';
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  
  const getFileIcon = (ext) => {
    if (['odt', 'docx', 'txt', 'md'].includes(ext)) return '📝';
    if (['ods', 'xlsx'].includes(ext)) return '📊';
    if (ext === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    return '📎';
  };

  return (
    <div
      ref={fileRef}
      className={`flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-lg" aria-hidden="true">{getFileIcon(fileExt)}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-200 uppercase">
            {fileName.toUpperCase()}
          </div>
          {file.size && (
            <div className="text-xs text-slate-500 mt-0.5">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <span className="px-3 py-1.5 text-slate-500 text-xs animate-pulse">
            ⏳ CHARGEMENT...
          </span>
        ) : file.url ? (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={onAccess}
            className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-400 transition-all duration-200 text-xs font-semibold uppercase"
            aria-label={`Accéder au fichier ${fileName}`}
          >
            🔍 ACCÉDER
          </a>
        ) : error ? (
          <span className="px-3 py-1.5 text-red-400 text-xs">
            ❌ ERREUR
          </span>
        ) : (
          <span className="px-3 py-1.5 text-slate-500 text-xs">
            ⏳ EN ATTENTE...
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(index)}
            className="px-2 py-1.5 bg-red-900/30 border border-red-500/50 rounded text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all duration-200"
            title="SUPPRIMER LE FICHIER"
            aria-label={`Supprimer le fichier ${fileName}`}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default LazyFile;

