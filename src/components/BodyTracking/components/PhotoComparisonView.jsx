/**
 * Vue Comparaison Side-by-Side Photos
 * 
 * Comparaison visuelle de photos avec:
 * - Slider morphing pour transition fluide
 * - Overlay métriques optionnel
 * - Zoom synchronisé
 * 
 * Référence: suiviphotoapprofondi.md - Section 7 (Comparaisons visuelles)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BarChart3,
  X
} from 'lucide-react';
import Button from '../../ui/Button';
import { formatDate } from '../../../utils/dateUtils';
import { generatePhotoWithMetricsOverlay } from '../utils/chartExportUtils';
import logger from '../../../utils/logger';

const log = logger.component('PhotoComparisonView');

const PhotoComparisonView = ({
  photos = [],
  showMetrics = true,
  onClose = null,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [morphingProgress, setMorphingProgress] = useState(0); // 0-100
  const [isMorphing, setIsMorphing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Auto-morphing
  useEffect(() => {
    if (isMorphing && photos.length > 1) {
      const interval = setInterval(() => {
        setMorphingProgress((prev) => {
          if (prev >= 100) {
            const nextIndex = (currentIndex + 1) % photos.length;
            setCurrentIndex(nextIndex);
            return 0;
          }
          return prev + 2; // Incrément de 2% à chaque frame
        });
      }, 50); // ~20fps

      return () => clearInterval(interval);
    }
  }, [isMorphing, currentIndex, photos.length]);

  const currentPhoto = photos[currentIndex] || null;
  const nextPhoto = photos[(currentIndex + 1) % photos.length] || null;

  if (!currentPhoto || photos.length === 0) {
    return (
      <div className="text-center py-12 text-teal-100/55">
        <p>Aucune photo disponible pour comparaison</p>
      </div>
    );
  }

  const navigatePhoto = (direction) => {
    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
      setMorphingProgress(0);
    } else {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
      setMorphingProgress(0);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Gérer sortie fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Contrôles */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-teal-100/55">
            Photo {currentIndex + 1}/{photos.length}
          </span>
          {photos.length > 1 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigatePhoto('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={isMorphing ? 'default' : 'ghost'}
                onClick={() => {
                  setIsMorphing(!isMorphing);
                  if (!isMorphing) {
                    setMorphingProgress(0);
                  }
                }}
              >
                {isMorphing ? 'Pause' : 'Play'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigatePhoto('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-sm text-teal-100/55">{Math.round(zoom * 100)}%</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Vue comparaison */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Mode morphing (transition fluide) */}
        {isMorphing && nextPhoto && morphingProgress > 0 && (
          <div className="relative">
            {/* Photo actuelle (fond) */}
            <img
              src={currentPhoto.url}
              alt={`Photo ${currentIndex + 1}`}
              className="w-full h-[600px] object-contain opacity-100"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'opacity 0.3s'
              }}
            />
            
            {/* Photo suivante (superposée avec opacité) */}
            <img
              src={nextPhoto.url}
              alt={`Photo ${currentIndex + 2}`}
              className="absolute top-0 left-0 w-full h-[600px] object-contain"
              style={{
                opacity: morphingProgress / 100,
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'opacity 0.3s'
              }}
            />
          </div>
        )}

        {/* Mode normal (side-by-side si 2+ photos) */}
        {(!isMorphing || morphingProgress === 0) && (
          <div className={`grid gap-4 ${photos.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {photos.length >= 2 ? (
              <>
                {/* Photo avant */}
                {currentIndex > 0 && (
                  <div className="relative">
                    <img
                      src={photos[currentIndex - 1].url}
                      alt="Photo avant"
                      className="w-full h-[600px] object-contain rounded"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center'
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-teal-100 text-sm">
                      {formatDate(photos[currentIndex - 1].date)}
                      {showOverlay && photos[currentIndex - 1].summary && (
                        <div className="text-xs mt-1">
                          Score: {photos[currentIndex - 1].summary.overallScore || 0}/100
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo actuelle */}
                <div className="relative border-2 border-[#0F4C5C]/55 rounded">
                  <img
                    src={currentPhoto.url}
                    alt="Photo actuelle"
                    className="w-full h-[600px] object-contain rounded"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center'
                    }}
                  />
                  {showOverlay && currentPhoto.summary && (
                    <div className="absolute top-4 left-4 bg-[#0F4C5C]/50/90 px-3 py-1 rounded text-teal-100 text-sm">
                      {formatDate(currentPhoto.date)}
                      <div className="text-xs mt-1">
                        Score: {currentPhoto.summary.overallScore || 0}/100
                      </div>
                      {currentPhoto.summary.averageScores && (
                        <div className="text-xs mt-1 space-y-1">
                          <div>Volume: {currentPhoto.summary.averageScores.volume || 0}/100</div>
                          <div>Définition: {currentPhoto.summary.averageScores.definition || 0}/100</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Photo après */}
                {currentIndex < photos.length - 1 && (
                  <div className="relative">
                    <img
                      src={photos[currentIndex + 1].url}
                      alt="Photo après"
                      className="w-full h-[600px] object-contain rounded"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center'
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-teal-100 text-sm">
                      {formatDate(photos[currentIndex + 1].date)}
                      {showOverlay && photos[currentIndex + 1].summary && (
                        <div className="text-xs mt-1">
                          Score: {photos[currentIndex + 1].summary.overallScore || 0}/100
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Une seule photo
              <div className="relative">
                <img
                  src={currentPhoto.url}
                  alt="Photo"
                  className="w-full h-[600px] object-contain rounded"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center'
                  }}
                />
                {showOverlay && currentPhoto.summary && (
                  <div className="absolute top-4 left-4 bg-[#0F4C5C]/50/90 px-3 py-1 rounded text-teal-100 text-sm">
                    {formatDate(currentPhoto.date)}
                    <div className="text-xs mt-1">
                      Score: {currentPhoto.summary.overallScore || 0}/100
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Barre progression morphing */}
        {isMorphing && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0F5C45]/40 h-2 rounded-full transition-all duration-50"
                style={{ width: `${morphingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Indicateurs navigation */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setMorphingProgress(0);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-[#0F5C45]/40 w-6' : 'bg-[#0F4C5C]/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toggle overlay */}
      {showMetrics && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showOverlay ? 'default' : 'ghost'}
            onClick={() => setShowOverlay(!showOverlay)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showOverlay ? 'Masquer' : 'Afficher'} métriques
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhotoComparisonView;

