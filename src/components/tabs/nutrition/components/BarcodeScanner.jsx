/**
 * BarcodeScanner - Composant Modal de Scan Code-Barres
 * 
 * Modal pour scanner un code-barres avec la caméra :
 * - Affichage flux caméra en temps réel
 * - Détection automatique code-barres (Quagga2)
 * - Timeout 10 secondes
 * - Fallback saisie manuelle
 * - Feedback visuel (rectangle détection)
 * 
 * @module components/tabs/nutrition/components/BarcodeScanner
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, Loader2, AlertCircle, CheckCircle, Keyboard } from 'lucide-react';
import { scanBarcodeWithFallback, stopScan, isCameraAvailable } from '../../../../services/nutrition/barcodeScanner';
import logger from '../../../../utils/logger';

const log = logger.module('BarcodeScanner');

/**
 * Composant Modal de Scan Code-Barres
 * 
 * @param {Object} props
 * @param {Function} props.onProductScanned - Callback appelé avec le produit scanné
 * @param {Function} props.onClose - Callback pour fermer le modal
 * @param {boolean} props.isOpen - État d'ouverture du modal
 */
const BarcodeScanner = ({ onProductScanned, onClose, isOpen }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'scanning' | 'detected' | 'error' | 'manual'
  const [detectedCode, setDetectedCode] = useState(null);
  const [countdown, setCountdown] = useState(10); // Compte à rebours timeout

  // Vérifier disponibilité caméra au montage
  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability();
    }
  }, [isOpen]);

  // Nettoyer scan à la fermeture
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
    }
  }, [isOpen]);

  // Compte à rebours pendant le scan
  useEffect(() => {
    if (scanning && status === 'scanning') {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(10);
    }
  }, [scanning, status]);

  /**
   * Vérifier si la caméra est disponible
   */
  const checkCameraAvailability = async () => {
    const available = await isCameraAvailable();
    if (!available) {
      setError('Caméra non disponible. Utilisez la saisie manuelle.');
      setStatus('error');
    }
  };

  /**
   * Démarrer le scan
   */
  const handleStartScan = useCallback(async () => {
    if (!videoRef.current) {
      setError('Élément vidéo non disponible');
      setStatus('error');
      return;
    }

    setScanning(true);
    setStatus('scanning');
    setError(null);
    setDetectedCode(null);
    setCountdown(10);

    try {
      const product = await scanBarcodeWithFallback(videoRef.current, {
        timeout: 10000,
        onDetected: (code) => {
          setDetectedCode(code);
          setStatus('detected');
        },
        onError: (err) => {
          log.warn('Erreur scan:', err);
          // Ne pas afficher erreur si c'est juste un timeout (on passe au fallback)
          if (err.message && err.message.includes('Timeout')) {
            setStatus('manual');
          } else {
            setError(err.message || 'Erreur lors du scan');
            setStatus('error');
          }
        }
      });

      if (product) {
        log.debug('Produit scanné:', product);
        onProductScanned(product);
        // Fermer modal après un court délai pour feedback visuel
        setTimeout(() => {
          stopScanning();
          onClose();
        }, 500);
      } else {
        // Produit non trouvé, proposer fallback manuel
        setStatus('manual');
      }
    } catch (err) {
      log.error('Erreur scan code-barres:', err);
      setError(err.message || 'Erreur lors du scan');
      setStatus('error');
    } finally {
      setScanning(false);
    }
  }, [onProductScanned, onClose]);

  /**
   * Arrêter le scan
   */
  const stopScanning = useCallback(() => {
    stopScan();
    setScanning(false);
    setStatus('idle');
    setError(null);
    setDetectedCode(null);
    setCountdown(10);
  }, []);

  /**
   * Gérer fallback manuel
   */
  const handleManualInput = useCallback(async () => {
    setStatus('manual');
    // Le fallback est géré automatiquement par scanBarcodeWithFallback
    // On relance juste le scan qui passera au fallback
    await handleStartScan();
  }, [handleStartScan]);

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Camera size={20} className="text-blue-400" />
            Scanner un Code-Barres
          </h3>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Zone vidéo */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Canvas pour overlay (rectangle détection) */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Overlay état */}
            {status === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                  <p className="text-sm">Scan en cours...</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {countdown > 0 ? `${countdown}s restantes` : 'Timeout...'}
                  </p>
                </div>
              </div>
            )}

            {status === 'detected' && detectedCode && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                <div className="text-center text-white">
                  <CheckCircle className="mx-auto mb-2" size={32} />
                  <p className="text-sm font-semibold">Code détecté !</p>
                  <p className="text-xs text-slate-300 mt-1">{detectedCode}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                <div className="text-center text-white">
                  <AlertCircle className="mx-auto mb-2" size={32} />
                  <p className="text-sm">{error || 'Erreur lors du scan'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-4 text-sm text-slate-400">
            <p className="mb-2">
              {status === 'scanning' && 'Pointez la caméra vers le code-barres du produit'}
              {status === 'idle' && 'Cliquez sur "Démarrer le scan" pour commencer'}
              {status === 'detected' && 'Produit détecté, recherche en cours...'}
              {status === 'error' && 'Une erreur est survenue. Essayez la saisie manuelle.'}
              {status === 'manual' && 'Scan automatique échoué. Utilisez la saisie manuelle ci-dessous.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {status === 'idle' && (
              <button
                onClick={handleStartScan}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Camera size={18} />
                Démarrer le Scan
              </button>
            )}

            {status === 'scanning' && (
              <button
                onClick={stopScanning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <X size={18} />
                Arrêter
              </button>
            )}

            {(status === 'error' || status === 'manual') && (
              <>
                <button
                  onClick={handleManualInput}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Keyboard size={18} />
                  Saisie Manuelle
                </button>
                <button
                  onClick={handleStartScan}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Camera size={18} />
                  Réessayer
                </button>
              </>
            )}

            <button
              onClick={() => {
                stopScanning();
                onClose();
              }}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
            <p className="mb-1">💡 <strong>Astuce :</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Assurez-vous que le code-barres soit bien éclairé</li>
              <li>Maintenez la caméra à environ 15-20 cm du code-barres</li>
              <li>Si le scan échoue, utilisez la saisie manuelle</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;

