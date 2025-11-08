
import React, { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';

interface StoryboardEditorProps {
    project: Project;
    updateProject: (project: Project) => void;
}

// Simple debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({ project, updateProject }) => {
    const [storyboard, setStoryboard] = useState(project.storyboard);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const debouncedStoryboard = useDebounce(storyboard, 1000);

    const handleSave = useCallback(() => {
        if (project.storyboard !== storyboard) {
            setStatus('saving');
            updateProject({ ...project, storyboard });
            setTimeout(() => setStatus('saved'), 500);
            setTimeout(() => setStatus('idle'), 2500);
        }
    }, [project, storyboard, updateProject]);
    
    // Auto-save when debounced value changes
    useEffect(() => {
        // This effect runs when the user stops typing
        if (debouncedStoryboard !== project.storyboard) {
            handleSave();
        }
    }, [debouncedStoryboard, project.storyboard, handleSave]);


    const renderStatus = () => {
        switch(status) {
            case 'saving': return <span className="text-sm text-[var(--text-muted)] animate-pulse">Saving...</span>;
            case 'saved': return <span className="text-sm text-[var(--success)]">Saved!</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h3 className="font-heading text-4xl">Storyboard / Notes</h3>
                 <div className="h-6">
                    {renderStatus()}
                 </div>
            </div>
            <p className="text-[var(--text-muted)] -mt-4 max-w-2xl">
                Write your story script, character notes, or any ideas here. Your progress is saved automatically.
            </p>
            <div className="bg-[var(--background)] p-2 rounded-lg border border-[var(--border)]">
                 <textarea
                    value={storyboard}
                    onChange={(e) => setStoryboard(e.target.value)}
                    placeholder="Start writing your comic script here..."
                    className="w-full h-[60vh] bg-[var(--surface-1)] text-[var(--text-main)] p-4 rounded-md border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
            </div>
        </div>
    );
};
