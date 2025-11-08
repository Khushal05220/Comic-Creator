
import React, { useState } from 'react';
import { Asset, AssetType, ImageData } from '../types';
import * as geminiService from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { MagicIcon } from './common/Icons';
import { ImageEditorModal } from './ImageEditorModal';
// Fix: Import `getImage` from dbService.
import { saveImage, getImage } from '../services/dbService';
import { ProjectImage } from './ProjectImage';

interface AssetCreatorProps {
  assetType: AssetType;
  projectStyle: string;
  promptTemplate: string;
  onSave: (asset: Asset) => void;
  onCancel: () => void;
}

const fileToGenerativePart = async (file: File): Promise<ImageData> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  return { base64, mimeType: file.type };
};

const assetTypeConfig = {
    Character: {
        title: "Create New Character",
        nameLabel: "Character Name",
        namePlaceholder: "e.g., Captain Nova",
        descLabel: "Appearance & Personality",
        descPlaceholder: "A tall hero with glowing blue eyes, wearing a silver and black suit. Confident but reckless.",
        previewText: "Your generated character sheet will appear here.",
        previewSubtext: "(Front, side, and back views)"
    },
    Location: {
        title: "Create New Location / Background",
        nameLabel: "Location / Background Name",
        namePlaceholder: "e.g., Neo-Veridia Rooftops",
        descLabel: "Scene & Atmosphere",
        descPlaceholder: "A sprawling futuristic city at night, with neon signs reflecting on wet streets and flying vehicles.",
        previewText: "Your generated location art will appear here.",
        previewSubtext: "(Concept art for a scene background)"
    },
}

export const AssetCreator: React.FC<AssetCreatorProps> = ({ assetType, projectStyle, promptTemplate, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [referenceImage, setReferenceImage] = useState<ImageData | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [generatedImageKey, setGeneratedImageKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorImageData, setEditorImageData] = useState<ImageData | null>(null);

  const config = assetTypeConfig[assetType];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setGeneratedImageKey(null); // Clear old generated image
        const generativePart = await fileToGenerativePart(file);
        setReferenceImage(generativePart);

        const reader = new FileReader();
        reader.onloadend = () => {
          setReferenceImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError("Failed to read the uploaded image.");
        console.error(err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!description || !name) {
      setError("Please provide a name and description.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const image = await geminiService.generateAssetSheet(description, name, projectStyle, promptTemplate, assetType, referenceImage);
      if (image) {
        const key = await saveImage(image);
        setGeneratedImageKey(key);
      }
    } catch (e) {
      setError(`Failed to generate ${assetType.toLowerCase()}. Please try again.`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (name && description && generatedImageKey) {
      const newAsset: Asset = {
        id: `${assetType.toLowerCase()}_${Date.now()}`,
        name,
        description,
        style: projectStyle,
        image: generatedImageKey,
      };
      onSave(newAsset);
    } else {
      setError(`Please generate an image for the ${assetType.toLowerCase()} before saving.`);
    }
  };

  const handleOpenEditor = async () => {
    if (generatedImageKey) {
        // Fix: `getImage` is from dbService, not geminiService.
        const imageData = await getImage(generatedImageKey);
        if (imageData) {
            setEditorImageData(imageData);
            setIsEditorOpen(true);
        }
    }
  };

  const handleSaveEdit = async (newImage: ImageData) => {
    const newKey = await saveImage(newImage);
    setGeneratedImageKey(newKey);
    setIsEditorOpen(false);
  };

  return (
    <>
    <div className="p-1 flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{config.nameLabel}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={config.namePlaceholder} className="input-base"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{config.descLabel}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={config.descPlaceholder} rows={4} className="input-base"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Reference Image (Optional)</label>
          <label htmlFor="ref-image-upload" className="w-full h-40 bg-[var(--surface-2)] rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] transition-colors cursor-pointer">
              {referenceImagePreview ? (
                  <img src={referenceImagePreview} alt="reference preview" className="max-h-full max-w-full object-contain rounded-md p-2" />
              ) : (
                  <div className="text-center text-[var(--text-muted)]">
                      <p className="font-semibold">Click to upload image</p>
                      <p className="text-xs mt-1">Provide an image for visual guidance.</p>
                  </div>
              )}
          </label>
          <input id="ref-image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Art Style: <span className="font-semibold text-[var(--text-main)]">{projectStyle}</span>
        </p>
        <button onClick={handleGenerate} disabled={isLoading} className="w-full flex justify-center items-center gap-2 py-3 btn btn-primary">
          {isLoading ? <Spinner /> : <><MagicIcon className="w-5 h-5"/> Generate {assetType}</>}
        </button>
      
        <button 
          onClick={handleOpenEditor}
          disabled={!generatedImageKey || isLoading}
          className="w-full bg-[var(--surface-2)] rounded-lg flex items-center justify-center p-4 min-h-[300px] border border-[var(--border)] group relative disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Spinner />
          ) : generatedImageKey ? (
            <ProjectImage imageKey={generatedImageKey} alt={`Generated ${assetType}`} className="max-h-full max-w-full object-contain rounded"/>
          ) : (
            <div className="text-center text-[var(--text-muted)]">
              <p>{config.previewText}</p>
              <p className="text-xs mt-2">{config.previewSubtext}</p>
            </div>
          )}
          {generatedImageKey && <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">Edit Image</div>}
        </button>
      </div>
      
      {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}

      <div className="mt-6 pt-6 border-t border-[var(--border)] flex justify-end gap-4">
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={!generatedImageKey} className="btn text-white bg-[var(--success)] hover:opacity-90">Save {assetType}</button>
      </div>
    </div>
    {isEditorOpen && editorImageData && (
        <ImageEditorModal 
            image={editorImageData}
            onClose={() => setIsEditorOpen(false)}
            onSave={handleSaveEdit}
        />
    )}
    </>
  );
};