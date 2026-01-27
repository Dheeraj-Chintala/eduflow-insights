import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useLazyLoad } from '@/hooks/useIntersectionObserver';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  wrapperClassName?: string;
}

export function LazyImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
  wrapperClassName,
  ...props
}: LazyImageProps) {
  const [imageRef, isVisible] = useLazyLoad<HTMLImageElement>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
    }
  }, [isVisible, src]);

  const imageSrc = hasError ? fallback : (isVisible && isLoaded ? src : undefined);

  return (
    <div 
      className={cn("relative overflow-hidden", wrapperClassName)}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div 
          className={cn(
            "absolute inset-0 bg-muted animate-pulse flex items-center justify-center",
            className
          )}
          aria-hidden="true"
        >
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
        </div>
      )}
      
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  );
}
