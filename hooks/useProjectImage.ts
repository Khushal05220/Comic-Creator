
import { useState, useEffect } from 'react';
import { getImage } from '../services/dbService';

const useProjectImage = (imageKey: string | null): [string | null, boolean] => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let current = true;

    const fetchImage = async () => {
      if (!imageKey) {
        setImageUrl(null);
        return;
      }
      setIsLoading(true);
      try {
        const imageData = await getImage(imageKey);
        if (imageData && current) {
          const dataUrl = `data:${imageData.mimeType};base64,${imageData.base64}`;
          setImageUrl(dataUrl);
        } else {
          setImageUrl(null);
        }
      } catch (error) {
        console.error("Failed to fetch image from DB", error);
        setImageUrl(null);
      } finally {
        if (current) {
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      current = false;
    };
  }, [imageKey]);

  return [imageUrl, isLoading];
};

export default useProjectImage;
