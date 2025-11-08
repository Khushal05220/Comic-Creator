

import React, { useState } from 'react';
import { Project } from '../types';
import { DEFAULT_CHARACTER_PROMPT, DEFAULT_LOCATION_PROMPT, DEFAULT_PANEL_PROMPT } from '../constants';

interface PromptEditorProps {
    project: Project;
    updateProject: (project: Project) => void;
}

const Placeholder: React.FC<{ name: string }> = ({ name }) => (
    <code className="bg-blue-100 text-[var(--primary)] text-xs font-mono px-1.5 py-1 rounded">{`{{${name}}}`}</code>
);

const AssetPlaceholders = () => (
    <div className="space-x-2">
        <Placeholder name="name" />
        <Placeholder name="description" />
        <Placeholder name="style" />
        <Placeholder name="style_enhancers" />
    </div>
);

const PanelPlaceholders = () => (
    <div className="flex flex-wrap gap-2">
        <Placeholder name="style" />
        <Placeholder name="style_enhancers" />
        <Placeholder name="character_references" />
        <Placeholder name="scene_description" />
        <Placeholder name="advanced_prompt" />
        <Placeholder name="dialogue" />
    </div>
);

export const PromptEditor: React.FC<PromptEditorProps> = ({ project, updateProject }) => {
    const [charPrompt, setCharPrompt] = useState(project.promptSettings.character);
    const [panelPrompt, setPanelPrompt] = useState(project.promptSettings.panel);
    const [locationPrompt, setLocationPrompt] = useState(project.promptSettings.location);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        updateProject({
            ...project,
            promptSettings: { 
                character: charPrompt, 
                panel: panelPrompt,
                location: locationPrompt,
            }
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleReset = (type: 'character' | 'panel' | 'location') => {
        if (type === 'character') setCharPrompt(DEFAULT_CHARACTER_PROMPT);
        if (type === 'panel') setPanelPrompt(DEFAULT_PANEL_PROMPT);
        if (type === 'location') setLocationPrompt(DEFAULT_LOCATION_PROMPT);
    };
    
    const hasChanges = project.promptSettings.character !== charPrompt 
      || project.promptSettings.panel !== panelPrompt
      || project.promptSettings.location !== locationPrompt;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <h3 className="font-heading text-4xl">AI Prompt Library</h3>
                 <div className="flex items-center gap-4">
                    {isSaved && <p className="text-green-600 animate-fade-in">Changes saved!</p>}
                    <button 
                        onClick={handleSave} 
                        disabled={!hasChanges}
                        className="btn text-white bg-[var(--success)] hover:opacity-90"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
            <p className="text-[var(--text-muted)] -mt-6 max-w-3xl">
                Refine the base prompts used to generate AI assets and panels for this project. Use the placeholders to inject dynamic content from your assets and panel descriptions.
            </p>

            {/* Character Prompt Editor */}
            <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-[var(--text-main)]">Character Prompt</h4>
                    <button onClick={() => handleReset('character')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Reset to Default</button>
                </div>
                <textarea value={charPrompt} onChange={(e) => setCharPrompt(e.target.value)} rows={8} className="input-base font-mono text-sm" />
                <div className="mt-4 p-3 bg-[var(--surface-1)] rounded-md border border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text-main)] mb-2">Available Placeholders:</p>
                    <AssetPlaceholders />
                </div>
            </div>
            
            {/* Location Prompt Editor */}
            <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-[var(--text-main)]">Location / Background Prompt</h4>
                    <button onClick={() => handleReset('location')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Reset to Default</button>
                </div>
                <textarea value={locationPrompt} onChange={(e) => setLocationPrompt(e.target.value)} rows={8} className="input-base font-mono text-sm" />
                <div className="mt-4 p-3 bg-[var(--surface-1)] rounded-md border border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text-main)] mb-2">Available Placeholders:</p>
                    <AssetPlaceholders />
                </div>
            </div>

            {/* Panel Prompt Editor */}
             <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border)]">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold text-[var(--text-main)]">Comic Panel Prompt</h4>
                    <button onClick={() => handleReset('panel')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Reset to Default</button>
                </div>
                <textarea value={panelPrompt} onChange={(e) => setPanelPrompt(e.target.value)} rows={15} className="input-base font-mono text-sm" />
                 <div className="mt-4 p-3 bg-[var(--surface-1)] rounded-md border border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text-main)] mb-2">Available Placeholders:</p>
                    <PanelPlaceholders />
                </div>
            </div>
        </div>
    );
};