import React, { useState, useEffect } from 'react';
import { getOptimizedAnimeImageUrl, ANIME_FALLBACK_IMAGES } from '../utils/imageEnhancer';

// In-memory cache for fast instant rendering of already loaded assets
const loadedImageCache = new Set<string>();

interface EnhancedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  enhance?: boolean;
  enhanceLevel?: 'standard' | 'ultra';
  containerClassName?: string;
}

export const EnhancedImage: React.FC<EnhancedImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  enhance = false,
  enhanceLevel = 'standard',
  containerClassName = '',
  loading = 'lazy',
  ...props
}) => {
  const initialUrl = getOptimizedAnimeImageUrl(src);
  const isPrecached = initialUrl ? loadedImageCache.has(initialUrl) : false;

  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [isLoaded, setIsLoaded] = useState<boolean>(isPrecached);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const nextUrl = getOptimizedAnimeImageUrl(src);
    setCurrentSrc(nextUrl);
    setHasError(false);
    if (nextUrl && loadedImageCache.has(nextUrl)) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fallback = fallbackSrc || ANIME_FALLBACK_IMAGES.default;
      setCurrentSrc(fallback);
    }
  };

  const handleLoad = () => {
    if (currentSrc) {
      loadedImageCache.add(currentSrc);
    }
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Lightweight static placeholder without CPU-heavy animations */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-800/80" />
      )}

      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        draggable={false}
        {...props}
      />
    </div>
  );
};


