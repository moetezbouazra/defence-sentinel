import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from './skeleton';
import { motion } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  onLoad?: () => void;
}

export function LazyImage({ src, alt, className, aspectRatio = 'aspect-video', onLoad }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView && !imageSrc) {
      setImageSrc(src);
    }
  }, [inView, src, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={ref} className={`relative ${aspectRatio} ${className || ''}`}>
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      {imageSrc && (
        <motion.img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
}
