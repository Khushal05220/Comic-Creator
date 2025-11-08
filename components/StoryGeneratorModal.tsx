

import React, { useState } from 'react';
import { Project, ComicPage, Panel, PageLayout, Character, StoryPageGenData, StoryPanelGenData } from '../types';
import * as geminiService from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { MagicIcon } from './common/Icons';
import { saveImage, getImage } from '../services/dbService';
import { ProjectImage } from './ProjectImage';
import { layoutToGridClasses, getPanelGridClass } from '../services/layoutUtils';

interface StoryGeneratorModalProps {
  project: Project;
  onSave: (pages: ComicPage[]) => void;
  onCancel: () => void;
}

type GenerationStep = 'INPUT' | 'GENERATING' | 'REVIEW' | 'ERROR';

interface GeneratedPanel extends Panel {
  status: 'pending' | 'generating' | 'done' | 'error';
}

interface GeneratedPage {
    layout: PageLayout;
    panels: GeneratedPanel[];
}

export const StoryGeneratorModal: React.FC<StoryGeneratorModalProps> = ({ project, onSave, onCancel }) => {
  const [step, setStep] = useState<GenerationStep>('INPUT');
  const [story, setStory] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);

  const handleGenerate = async () => {
    if (!story.trim()) {
      setErrorMessage("Please provide a story script.");
      return;
    }
    setStep('GENERATING');
    setErrorMessage('');
    
    try {
      setProgressMessage('Directing the story... (this may take a moment)');
      const storyboardPages = await geminiService.generateStoryboardFromStory(story, project.characters, project.style);
      
      if (!storyboardPages || storyboardPages.length === 0) {
          throw new Error("The AI director couldn't create a storyboard. Try to be more descriptive in your story.");
      }

      const initialPages: GeneratedPage[] = storyboardPages.map(pageData => ({
        layout: pageData.layout,
        panels: pageData.panels.map((panelData, i) => ({
            id: `genpanel_${Date.now()}_${i}`,
            description: panelData.scene_description,
            dialogue: panelData.dialogue,
            characterIds: project.characters.filter(c => panelData.characters_present.includes(c.name)).map(c => c.id),
            image: null,
            status: 'pending',
        }))
      }));
      setGeneratedPages(initialPages);

      let totalPanels = initialPages.reduce((sum, page) => sum + page.panels.length, 0);
      let panelsDone = 0;

      for (let pageIndex = 0; pageIndex < initialPages.length; pageIndex++) {
        let previousPanelImage: { base64: string; mimeType: string } | null = null;
        const page = initialPages[pageIndex];

        for (let panelIndex = 0; panelIndex < page.panels.length; panelIndex++) {
            panelsDone++;
            setProgressMessage(`Illustrating panel ${panelsDone} of ${totalPanels}...`);
            setGeneratedPages(prevPages => {
                const newPages = [...prevPages];
                newPages[pageIndex].panels[panelIndex].status = 'generating';
                return newPages;
            });
            
            const panelToGenerate = page.panels[panelIndex];
            const panelCharacters = project.characters.filter(c => panelToGenerate.characterIds.includes(c.id));
            const characterAssets = await Promise.all(panelCharacters.map(async c => ({...c, image: c.image ? await getImage(c.image): null})));
            
            try {
                const image = await geminiService.generateComicPanel(
                    panelToGenerate.description, 
                    panelToGenerate.dialogue, 
                    characterAssets, 
                    [], // No specific locations for now, AI infers from story
                    project.style, 
                    project.promptSettings.panel, 
                    undefined, 
                    previousPanelImage
                );

                if (image) {
                    previousPanelImage = image;
                    const imageKey = await saveImage(image);
                    setGeneratedPages(prev => {
                        const newPages = [...prev];
                        newPages[pageIndex].panels[panelIndex].image = imageKey;
                        newPages[pageIndex].panels[panelIndex].status = 'done';
                        return newPages;
                    });
                } else {
                    throw new Error("Image generation returned null");
                }
            } catch (panelError) {
                console.error(`Error generating panel:`, panelError);
                setGeneratedPages(prev => {
                    const newPages = [...prev];
                    newPages[pageIndex].panels[panelIndex].status = 'error';
                    return newPages;
                });
                previousPanelImage = null; // Reset context if a panel fails
            }
            
            // Add a delay to avoid hitting API rate limits
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      setProgressMessage('All pages generated!');
      setStep('REVIEW');

    } catch (e: any) {
      console.error(e);
      let friendlyMessage = e.message || "An unexpected error occurred.";
      const errorString = friendlyMessage.toLowerCase();
      if (errorString.includes('429') || errorString.includes('quota') || errorString.includes('rate limit')) {
          friendlyMessage = "You've exceeded the API rate limit. Please wait a moment and try again, or try a shorter story.";
      }
      setErrorMessage(friendlyMessage);
      setStep('ERROR');
    }
  };

  const handleSave = () => {
    const pages: ComicPage[] = generatedPages.map((genPage, index) => {
        const finalPanels = genPage.panels
            .filter(p => p.status === 'done' && p.image)
            .map(({ status, ...p }) => p as Panel);

        return {
            id: `genpage_${Date.now()}_${index}`,
            pageNumber: 0, // Will be re-numbered in ProjectWorkspace
            layout: genPage.layout,
            panels: finalPanels
        };
    }).filter(page => page.panels.length > 0);
    
    onSave(pages);
  };
  
  const renderInput = () => (
    <div className="space-y-6">
      <h2 className="font-heading text-4xl text-[var(--text-main)]">Generate Comic from Story</h2>
      <p className="text-[var(--text-muted)] -mt-4">The AI will read your story, create page layouts, and generate all the panels for you.</p>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Story Script</label>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="e.g., Captain Nova patrols the city at night. Suddenly, a distress signal appears. He swoops down to investigate an alley..."
          rows={12}
          className="input-base"
        />
        <p className="text-xs text-[var(--text-muted)] mt-2">Make sure to use the names of your created characters (e.g., "{project.characters[0]?.name || 'Your Character'}") in the script so the AI can recognize them.</p>
      </div>
     
      {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button onClick={handleGenerate} disabled={!story.trim()} className="btn btn-primary">
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
        <div className="space-y-4">
            {generatedPages.map((page, pageIndex) => (
                 <div key={pageIndex} className="grid gap-2 p-2 bg-[var(--background)] rounded-lg" style={{gridTemplateColumns: `repeat(${Math.ceil(page.panels.length/2)}, 1fr)`}}>
                    {page.panels.map(panel => (
                        <div key={panel.id} className="relative aspect-square bg-[var(--surface-2)] rounded-md flex items-center justify-center overflow-hidden border border-[var(--border)]">
                            {panel.status === 'generating' && <Spinner />}
                            {panel.status === 'done' && <ProjectImage imageKey={panel.image} alt={panel.description} className="w-full h-full object-cover rounded"/>}
                            {panel.status === 'error' && <div className="text-center text-red-500 p-2"><p className="font-bold">Error</p><p className="text-xs">Failed</p></div>}
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </div>
  );

  const renderReview = () => (
    <div className="p-2 max-h-[80vh] overflow-y-auto">
        <h2 className="font-heading text-4xl text-[var(--text-main)] mb-4">Review Your Comic</h2>
        <p className="text-[var(--text-muted)] mb-6">Review the generated pages. Panels that failed to generate will be skipped. You can add the successful pages to your project.</p>
         <div className="space-y-8">
            {generatedPages.map((page, pageIndex) => (
                <div key={pageIndex} className="bg-[var(--background)] p-2 rounded-lg border border-[var(--border)]">
                    <h3 className="font-bold text-center mb-2 text-sm text-[var(--text-muted)]">Page {pageIndex + 1} (Layout: {page.layout})</h3>
                    <div className={`grid ${layoutToGridClasses[page.layout]} gap-1`}>
                        {page.panels.map(panel => (
                            <div key={panel.id} className={`relative aspect-square bg-[var(--surface-2)] rounded-sm flex items-center justify-center overflow-hidden ${getPanelGridClass(page.layout, page.panels.indexOf(panel))}`}>
                                {panel.status === 'done' && panel.image ? (
                                    <ProjectImage imageKey={panel.image} alt={panel.description} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="text-center text-gray-500 p-1"><p className="font-bold text-xs">Skipped</p></div>
                                )}
                            </div>
                        ))}
                    </div>
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