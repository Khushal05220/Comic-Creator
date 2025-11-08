

import React, { useState } from 'react';
import { Project, ComicPage, Panel, PageLayout, Character } from '../types';
import * as geminiService from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { MagicIcon } from './common/Icons';
import { saveImage, getImage } from '../services/dbService';
import { ProjectImage } from './ProjectImage';

interface StoryGeneratorModalProps {
  project: Project;
  onSave: (pages: ComicPage[]) => void;
  onCancel: () => void;
}

const layouts: { id: PageLayout, name: string, panelCount: number }[] = [
  { id: '1x1', name: '1 Panel / Page', panelCount: 1 },
  { id: '2x1', name: '2 Panels / Page', panelCount: 2 },
  { id: '3x1', name: '3 Panels / Page', panelCount: 3 },
  { id: '2x2', name: '4 Panels / Page', panelCount: 4 },
];

type GenerationStep = 'INPUT' | 'GENERATING' | 'REVIEW' | 'ERROR';

interface GeneratedPanel extends Panel {
  status: 'pending' | 'generating' | 'done' | 'error';
  is_new_scene: boolean;
}

export const StoryGeneratorModal: React.FC<StoryGeneratorModalProps> = ({ project, onSave, onCancel }) => {
  const [step, setStep] = useState<GenerationStep>('INPUT');
  const [story, setStory] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [layout, setLayout] = useState<PageLayout>('2x2');
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedPanels, setGeneratedPanels] = useState<GeneratedPanel[]>([]);

  const handleCharToggle = (id: string) => {
    setSelectedCharIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };
  
  const handleGenerate = async () => {
    if (!story.trim() || selectedCharIds.length === 0) {
      setErrorMessage("Please provide a story and select at least one character.");
      return;
    }
    setStep('GENERATING');
    setErrorMessage('');
    
    try {
      setProgressMessage('Analyzing story and creating storyboard...');
      const selectedChars = project.characters.filter(c => selectedCharIds.includes(c.id));
      const panelDescriptions = await geminiService.generateStoryboardFromStory(story, selectedChars, project.style);
      
      if (!panelDescriptions || panelDescriptions.length === 0) {
          throw new Error("The AI could not generate any panels from the story. Try to be more descriptive.");
      }

      const initialPanels: GeneratedPanel[] = panelDescriptions.map((desc, i) => ({
        id: `genpanel_${Date.now()}_${i}`,
        description: desc.scene_description,
        dialogue: desc.dialogue,
        characterIds: project.characters.filter(c => desc.characters_present.includes(c.name)).map(c => c.id),
        image: null,
        status: 'pending',
        is_new_scene: desc.is_new_scene,
      }));
      setGeneratedPanels(initialPanels);

      let previousPanelImage: { base64: string; mimeType: string } | null = null;

      for (let i = 0; i < initialPanels.length; i++) {
        setProgressMessage(`Generating image for panel ${i + 1} of ${initialPanels.length}...`);
        setGeneratedPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'generating' } : p));
        
        const panelToGenerate = initialPanels[i];
        const panelCharacters = project.characters.filter(c => panelToGenerate.characterIds.includes(c.id));
        const characterAssets = await Promise.all(panelCharacters.map(async c => ({...c, image: c.image ? await getImage(c.image): null})));

        if (panelToGenerate.is_new_scene) {
            previousPanelImage = null;
        }
        
        try {
            const image = await geminiService.generateComicPanel(
                panelToGenerate.description, 
                panelToGenerate.dialogue, 
                characterAssets, 
                [], // No locations in story generator
                project.style, 
                project.promptSettings.panel, 
                undefined, 
                previousPanelImage
            );

            if (image) {
                previousPanelImage = image;
                const imageKey = await saveImage(image);
                setGeneratedPanels(prev => prev.map((p, idx) => idx === i ? { ...p, image: imageKey, status: 'done' } : p));
            } else {
                throw new Error("Image generation returned null");
            }
        } catch (panelError) {
             console.error(`Error generating panel ${i+1}:`, panelError);
             setGeneratedPanels(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error' } : p));
             previousPanelImage = null;
        }
        
        // Add a delay to avoid hitting API rate limits, but not for the last item.
        if (i < initialPanels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
        }
      }
      setProgressMessage('All panels generated!');
      setStep('REVIEW');

    } catch (e: any) {
      console.error(e);
      let friendlyMessage = e.message || "An unexpected error occurred.";
      const errorString = friendlyMessage.toLowerCase();
      if (errorString.includes('429') || errorString.includes('quota') || errorString.includes('rate limit')) {
          friendlyMessage = "You've exceeded the API rate limit. Please wait a moment and try again, or try a shorter story. For more details, check your Google AI Studio plan and billing.";
      }
      setErrorMessage(friendlyMessage);
      setStep('ERROR');
    }
  };

  const handleSave = () => {
    const panelCountPerLayout = layouts.find(l => l.id === layout)!.panelCount;
    const finalPanels = generatedPanels.filter(p => p.status === 'done' && p.image);
    
    if (finalPanels.length === 0) {
        onCancel();
        return;
    }

    const pages: ComicPage[] = [];
    for (let i = 0; i < finalPanels.length; i += panelCountPerLayout) {
        const pagePanels = finalPanels.slice(i, i + panelCountPerLayout).map(({status, is_new_scene, ...p}) => p);
        if (pagePanels.length > 0) {
            pages.push({
                id: `genpage_${Date.now()}_${pages.length}`,
                pageNumber: 0,
                layout: layout,
                panels: pagePanels
            });
        }
    }
    onSave(pages);
  };
  
  const renderInput = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-4xl text-[var(--text-main)]">Generate Comic from Story</h2>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Story Script</label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="e.g., Captain Nova patrols the city at night. Suddenly, a distress signal appears. He swoops down to investigate an alley..."
          rows={8}
          className="input-base"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Characters in this Story</label>
        <div className="flex flex-wrap gap-2 p-2 bg-[var(--background)] rounded-md max-h-48 overflow-y-auto border border-[var(--border)]">
            {project.characters.map(char => (
                <button key={char.id} onClick={() => handleCharToggle(char.id)} className={`p-1 rounded-md border-2 transition-all ${selectedCharIds.includes(char.id) ? 'border-[var(--primary)]' : 'border-transparent bg-[var(--surface-1)] hover:border-[var(--border-hover)]'}`}>
                    <div className="w-16 h-16 rounded bg-[var(--surface-2)]">
                       <ProjectImage imageKey={char.image} alt={char.name} className="w-16 h-16 object-contain rounded"/>
                    </div>
                    <p className="text-xs mt-1 text-[var(--text-main)]">{char.name}</p>
                </button>
            ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Page Layout</label>
        <select value={layout} onChange={(e) => setLayout(e.target.value as PageLayout)} className="input-base">
          {layouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button onClick={handleGenerate} className="btn btn-primary">
          <MagicIcon className="w-5 h-5" /> Generate
        </button>
      </div>
    </div>
  );
  
  const renderProgress = () => (
      <div className="p-2 max-h-[80vh] overflow-y-auto">
        <h2 className="font-heading text-4xl text-[var(--text-main)] mb-4">Generating Your Comic...</h2>
        <div className="flex items-center justify-center gap-4 mb-6 bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
            <Spinner />
            <p className="text-lg font-semibold text-[var(--text-muted)]">{progressMessage}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedPanels.map(panel => (
                <div key={panel.id} className="relative aspect-square bg-[var(--surface-2)] rounded-md flex items-center justify-center overflow-hidden border border-[var(--border)]">
                    {panel.status === 'generating' && <Spinner />}
                    {panel.status === 'done' && <ProjectImage imageKey={panel.image} alt={panel.description} className="w-full h-full object-cover rounded"/>}
                    {panel.status === 'error' && <div className="text-center text-red-500 p-2"><p className="font-bold">Error</p><p className="text-xs">Failed to generate</p></div>}
                    {panel.dialogue && panel.status === 'done' && (
                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] p-1 rounded shadow-lg backdrop-blur-sm border border-white/20">
                            {panel.dialogue}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
  );

  const renderReview = () => (
    <div className="p-2 max-h-[80vh] overflow-y-auto">
        <h2 className="font-heading text-4xl text-[var(--text-main)] mb-4">Review Your Comic</h2>
        <p className="text-[var(--text-muted)] mb-6">Review the generated pages. You can add them to your project or discard them. Panels that failed to generate will be skipped.</p>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedPanels.map(panel => (
                <div key={panel.id} className="relative aspect-square bg-[var(--surface-2)] rounded-md flex items-center justify-center overflow-hidden border border-[var(--border)]">
                    {panel.status === 'done' && panel.image ? (
                        <>
                            <ProjectImage imageKey={panel.image} alt={panel.description} className="w-full h-full object-cover rounded"/>
                            {panel.dialogue && (
                                <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] p-1 rounded shadow-lg backdrop-blur-sm border border-white/20">
                                    {panel.dialogue}
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="text-center text-gray-500 p-2"><p className="font-bold">Skipped</p><p className="text-xs">Panel failed to generate</p></div>
                    )}
                </div>
            ))}
        </div>
        <div className="mt-8 flex justify-end gap-4">
            <button onClick={onCancel} className="btn btn-secondary">Discard</button>
            <button onClick={handleSave} className="btn bg-[var(--success)] text-white hover:opacity-90">Add to Project</button>
        </div>
    </div>
  );
  
  const renderError = () => (
       <div className="text-center p-8">
            <h2 className="font-heading text-4xl text-red-500 mb-4">Generation Failed</h2>
            <p className="text-[var(--text-muted)] bg-[var(--background)] p-4 rounded-md border border-[var(--border)]">{errorMessage}</p>
            <button onClick={() => setStep('INPUT')} className="mt-6 btn btn-primary">Try Again</button>
       </div>
  );

  switch (step) {
    case 'GENERATING': return renderProgress();
    case 'REVIEW': return renderReview();
    case 'ERROR': return renderError();
    case 'INPUT':
    default:
      return renderInput();
  }
};