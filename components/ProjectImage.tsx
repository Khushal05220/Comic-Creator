import React from 'react';
import useProjectImage from '../hooks/useProjectImage';
import { Spinner } from './common/Spinner';

interface ProjectImageProps {
  imageKey: string | null;
  alt: string;
  className?: string;
}

export const ProjectImage: React.FC<ProjectImageProps> = ({ imageKey, alt, className }) => {
  const [imageUrl, isLoading] = useProjectImage(imageKey);

  if (isLoading) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-xs text-center p-2 text-[var(--text-muted)] ${className}`}>
        Image not found
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} className={className} />;
};
