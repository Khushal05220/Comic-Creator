

import React, { useState } from 'react';
import { Modal } from './common/Modal';
import * as geminiService from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { MagicIcon } from './common/Icons';
import { ImageData } from '../types';

interface ImageEditorModalProps {
  image: ImageData;
  onClose: () => void;
  onSave: (newImage: ImageData) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ image, onClose, onSave }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateEdit = async () => {
    if (!editPrompt.trim()) {
      setError("Please provide an edit description.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const imageToEdit = editedImage || image;
      const result = await geminiService.editImage(imageToEdit.base64, imageToEdit.mimeType, editPrompt);
      if (result) {
        setEditedImage(result);
      } else {
        throw new Error("The AI failed to return an edited image.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to edit image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = () => {
    if (editedImage) {
        onSave(editedImage);
    }
  }

  const currentImage = editedImage || image;

  return (
    <Modal onClose={onClose}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--background)] p-4 rounded-lg flex items-center justify-center min-h-[60vh]">
          <img src={`data:${currentImage.mimeType};base64,${currentImage.base64}`} alt="Image preview" className="max-w-full max-h-[70vh] object-contain"/>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="font-heading text-4xl text-[var(--text-main)]">Image Editor</h3>
          <p className="text-[var(--text-muted)] text-sm -mt-2">Describe the changes you want to make to the image. This will use the AI to edit the current image.</p>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Edit Description</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., 'add a futuristic helmet', 'make the background a rainy city street', 'change the color of the suit to red'"
              rows={5}
              className="input-base"
            />
          </div>
          <button onClick={handleGenerateEdit} disabled={isLoading || !editPrompt.trim()} className="w-full btn btn-primary">
            {isLoading ? <Spinner/> : <><MagicIcon className="w-5 h-5"/> Generate Edit</>}
          </button>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <div className="mt-auto pt-4 border-t border-[var(--border)] flex justify-end gap-4">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={!editedImage} className="btn text-white bg-[var(--success)] hover:opacity-90">Save Changes</button>
          </div>
        </div>
      </div>
    </Modal>
  );
};