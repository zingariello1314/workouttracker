/**
 * ImageUploader Component
 * Upload d'images avec drag & drop et preview
 */

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ onImageSelect, currentImage = null, maxSize = 5 }) => {
  const [preview, setPreview] = useState(currentImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image');
      return;
    }

    // Validate file size (in MB)
    if (file.size > maxSize * 1024 * 1024) {
      setError(`L'image ne doit pas dépasser ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPreview(base64);
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-slate-600"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
            }
          `}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
            {isDragging ? (
              <>
                <Upload className="w-12 h-12 text-blue-400 animate-bounce" />
                <p className="text-sm font-medium text-blue-400">Déposez l'image ici</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12" />
                <div className="text-center">
                  <p className="text-sm font-medium">Cliquez ou glissez une image</p>
                  <p className="text-xs mt-1">Max {maxSize}MB</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
