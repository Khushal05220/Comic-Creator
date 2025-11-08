import React, { useState, useMemo, useCallback } from 'react';
import { Project, ComicPage, Panel, PageLayout, Character, ImageData, Location } from '../types';
import * as geminiService from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { MagicIcon, ChevronDownIcon, BackIcon } from './common/Icons';
import { CAMERA_ANGLES, EXPRESSIONS, LIGHTING_STYLES } from '../constants';
import { ImageEditorModal } from './ImageEditorModal';
import { getPanelGridClass, layoutToGridClasses } from '../services/layoutUtils';
import { saveImage, getImage } from '../services/dbService';
import { ProjectImage } from './ProjectImage';

interface PageEditorProps {
  project: Project;
  pageToEdit?: ComicPage;
  onSave: (page: ComicPage) => void;
  onCancel: () => void;
}

const layouts: { id: PageLayout, panelCount: number }[] = [
  { id: '1x1', panelCount: 1 },
  { id: '1x2', panelCount: 2 },
  { id: '2x1', panelCount: 2 },
  { id: 'dominant-top', panelCount: 3 },
  { id: 'dominant-left', panelCount: 3 },
  { id: 'timeline-vert', panelCount: 3 },
  { id: '2x2', panelCount: 4 },
  { id: 'four-varied', panelCount: 4 },
];

interface PanelState extends Panel {
  advancedPrompt: string;
  showAdvanced: boolean;
}

export const PageEditor: React.FC<PageEditorProps> = ({ project, pageToEdit, onSave, onCancel }) => {
  const [layout, setLayout] = useState<PageLayout>(pageToEdit?.layout || '1x1');
  const [panels, setPanels] = useState<PanelState[]>([]);
  const [loadingPanels, setLoadingPanels] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [editorImageData, setEditorImageData] = useState<{
      panelId: string;
      image: ImageData;
    } | null>(null);

  useMemo(() => {
    const currentLayout = layouts.find(l => l.id === layout);
    if (!currentLayout) return;

    const createNewPanel = (i: number): PanelState => ({
      id: `panel_${Date.now()}_${i}`,
      description: '',
      dialogue: '',
      characterIds: [],
      locationIds: [],
      image: null,
      advancedPrompt: '',
      showAdvanced: false,
      cameraAngle: '',
      lighting: '',
    });

    if (pageToEdit && pageToEdit.layout === layout) {
        const existingPanels = pageToEdit.panels.slice(0, currentLayout.panelCount);
        const newPanelsNeeded = currentLayout.panelCount - existingPanels.length;

        const newPanels = [
            ...existingPanels.map(p => ({ ...p, advancedPrompt: '', showAdvanced: false })),
            ...Array.from({ length: newPanelsNeeded }, (_, i) => createNewPanel(existingPanels.length + i))
        ];
        setPanels(newPanels);
    } else {
        setPanels(Array.from({ length: currentLayout.panelCount }, (_, i) => createNewPanel(i)));
    }
}, [layout, pageToEdit]);


  const updatePanel = useCallback((index: number, field: keyof PanelState, value: any) => {
    setPanels(prevPanels => {
        const newPanels = [...prevPanels];
        (newPanels[index] as any)[field] = value;
        return newPanels;
    });
  }, []);

  const handleCharacterToggle = (panelIndex: number, charId: string) => {
    const panel = panels[panelIndex];
    const newCharIds = panel.characterIds.includes(charId)
      ? panel.characterIds.filter(id => id !== charId)
      : [...panel.characterIds, charId];
    updatePanel(panelIndex, 'characterIds', newCharIds);
  };
  
  const handleLocationToggle = (panelIndex: number, locId: string) => {
    const panel = panels[panelIndex];
    const newLocIds = panel.locationIds?.includes(locId)
      ? panel.locationIds.filter(id => id !== locId)
      : [...(panel.locationIds || []), locId];
    updatePanel(panelIndex, 'locationIds', newLocIds);
  };


  const handleGeneratePanel = async (panelIndex: number) => {
    const panel = panels[panelIndex];
    if (!panel.description) {
      setError(`Panel ${panelIndex + 1}: Please provide a scene description.`);
      return;
    }
    
    setLoadingPanels(prev => new Set(prev).add(panel.id));
    setError(null);
    try {
      const prevPanelImageKey = panelIndex > 0 ? panels[panelIndex - 1].image : null;
      const previousPanelImage = prevPanelImageKey ? await getImage(prevPanelImageKey) : null;
      
      const charactersForPanel = project.characters.filter(c => panel.characterIds.includes(c.id));
      const characterAssets = await Promise.all(
          charactersForPanel.map(async c => ({
              ...c,
              image: c.image ? await getImage(c.image) : null
          }))
      );
      
      const locationsForPanel = project.locations.filter(l => panel.locationIds?.includes(l.id));
      const locationAssets = await Promise.all(
          locationsForPanel.map(async l => ({
              ...l,
              image: l.image ? await getImage(l.image) : null
          }))
      );

      const image = await geminiService.generateComicPanel(
        panel.description,
        panel.dialogue,
        characterAssets,
        locationAssets,
        project.style,
        project.promptSettings.panel,
        panel.advancedPrompt,
        previousPanelImage,
        panel.cameraAngle,
        panel.lighting
      );
      
      if (image) {
        const imageKey = await saveImage(image);
        updatePanel(panelIndex, 'image', imageKey);
      }
    } catch (e) {
      setError(`Failed to generate panel ${panelIndex + 1}. Please try again.`);
      console.error(e);
    } finally {
      setLoadingPanels(prev => { const newSet = new Set(prev); newSet.delete(panel.id); return newSet; });
    }
  };

  const handleSavePage = () => {
    if (panels.some(p => !p.image)) {
      setError("Please generate all panels before saving the page.");
      return;
    }
    const newPage: ComicPage = {
      id: pageToEdit?.id || `page_${Date.now()}`,
      pageNumber: pageToEdit?.pageNumber || project.pages.length + 1,
      layout,
      panels: panels.map(({ advancedPrompt, showAdvanced, ...p }) => p),
    };
    onSave(newPage);
  };
  
  const handleSaveImageEdit = async (newImage: ImageData) => {
    if (!editorImageData) return;
    const { panelId } = editorImageData;

    const newImageKey = await saveImage(newImage);
    const panelIndex = panels.findIndex(p => p.id === panelId);
    if (panelIndex > -1) {
        updatePanel(panelIndex, 'image', newImageKey);
    }
    setEditorImageData(null);
  };
  
  const handleOpenImageEditor = async (panel: Panel) => {
    if (panel.image) {
        const imageData = await getImage(panel.image);
        if (imageData) {
            setEditorImageData({ panelId: panel.id, image: imageData });
        }
    }
  };

  const SelectControl: React.FC<{label:string, value:string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]}> = ({label, value, onChange, options}) => (
    <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{label}</label>
        <select value={value} onChange={onChange} className="input-base text-sm p-2">
            <option value="">Default</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[var(--background)] z-50 flex flex-col animate-fade-in">
      <header className="flex-shrink-0 bg-[var(--surface-1)]/80 backdrop-blur-lg border-b border-[var(--border)] p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="btn btn-secondary">
            <BackIcon className="w-5 h-5" />
            Back to Project
          </button>
          <h2 className="font-heading text-4xl">{pageToEdit ? `Editing Page ${pageToEdit.pageNumber}` : 'Create a New Page'}</h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-6">
                {!pageToEdit && (
                  <div className="bg-[var(--surface-1)] p-6 rounded-xl border border-[var(--border)]">
                    <label className="block text-lg font-bold text-[var(--text-main)] mb-4">Page Layout</label>
                    <div className="flex gap-3 flex-wrap">
                      {layouts.map(l => (
                        <button 
                          key={l.id} 
                          onClick={() => setLayout(l.id)} 
                          title={`${l.panelCount} panels`}
                          className={`p-2 rounded-lg transition-colors border-2 ${layout === l.id ? 'border-[var(--primary)] bg-blue-500/10' : 'bg-[var(--surface-2)] hover:bg-[var(--border)] border-transparent'}`}
                        >
                          <div className={`w-12 h-12 p-1 grid gap-1 ${layoutToGridClasses[l.id]}`}>
                              {Array.from({ length: l.panelCount }).map((_, i) => (
                                  <div key={i} className={`bg-[var(--text-muted)] rounded-sm ${getPanelGridClass(l.id, i)}`}></div>
                              ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {panels.map((panel, index) => (
                    <div key={panel.id} className="bg-[var(--surface-1)] p-6 rounded-xl border border-[var(--border)]">
                        <div className="space-y-4">
                            <h3 className="font-heading text-3xl text-[var(--text-main)]">Panel {index + 1}</h3>
                            <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Characters</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-[var(--background)] rounded-md border border-[var(--border)] min-h-[108px]">
                                {project.characters.map(char => (
                                <button key={char.id} onClick={() => handleCharacterToggle(index, char.id)} className={`p-1 rounded-md border-2 transition-all ${panel.characterIds.includes(char.id) ? 'border-[var(--primary)]' : 'border-transparent hover:border-[var(--border-hover)]'}`}>
                                    <div className="w-20 aspect-[3/4] bg-gray-700 rounded">
                                        <ProjectImage imageKey={char.image} alt={char.name} className="w-full h-full object-cover rounded"/>
                                    </div>
                                    <p className="text-xs mt-1 text-[var(--text-main)] w-20 truncate">{char.name}</p>
                                </button>
                                ))}
                            </div>
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Location / Background</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-[var(--background)] rounded-md border border-[var(--border)] min-h-[108px]">
                                {project.locations.map(loc => (
                                <button key={loc.id} onClick={() => handleLocationToggle(index, loc.id)} className={`p-1 rounded-md border-2 transition-all ${panel.locationIds?.includes(loc.id) ? 'border-[var(--primary)]' : 'border-transparent hover:border-[var(--border-hover)]'}`}>
                                    <div className="w-20 aspect-[3/4] bg-gray-700 rounded">
                                        <ProjectImage imageKey={loc.image} alt={loc.name} className="w-full h-full object-cover rounded"/>
                                    </div>
                                    <p className="text-xs mt-1 text-[var(--text-main)] w-20 truncate">{loc.name}</p>
                                </button>
                                ))}
                                {project.locations.length === 0 && <p className="text-xs text-center p-2 text-[var(--text-muted)] w-full">No locations created. You can add them in the "Assets" tab.</p>}
                            </div>
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Scene Description</label>
                            <textarea value={panel.description} onChange={(e) => updatePanel(index, 'description', e.target.value)} placeholder={`e.g., Captain Nova flies over the city at night.`} rows={3} className="input-base"/>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SelectControl label="Camera Angle" value={panel.cameraAngle || ''} onChange={e => updatePanel(index, 'cameraAngle', e.target.value)} options={CAMERA_ANGLES} />
                                <SelectControl label="Lighting" value={panel.lighting || ''} onChange={e => updatePanel(index, 'lighting', e.target.value)} options={LIGHTING_STYLES} />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Dialogue / Caption</label>
                            <input type="text" value={panel.dialogue} onChange={(e) => updatePanel(index, 'dialogue', e.target.value)} placeholder={`e.g., "I must protect these people."`} className="input-base"/>
                            </div>
                            <div>
                            <button onClick={() => updatePanel(index, 'showAdvanced', !panel.showAdvanced)} className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
                                Advanced Cinematography Notes <ChevronDownIcon className={`transition-transform ${panel.showAdvanced ? 'rotate-180' : ''}`} />
                            </button>
                            {panel.showAdvanced && <div className="mt-2 animate-fade-in"><textarea value={panel.advancedPrompt} onChange={(e) => updatePanel(index, 'advancedPrompt', e.target.value)} placeholder="e.g., Dutch angle, heavy lens flare, film grain" rows={2} className="input-base text-sm" /></div>}
                            </div>
                            <button onClick={() => handleGeneratePanel(index)} disabled={loadingPanels.has(panel.id)} className="w-full btn btn-primary mt-4">
                                {loadingPanels.has(panel.id) ? <Spinner /> : <><MagicIcon className="w-5 h-5" /> Generate Panel {index + 1}</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="hidden lg:block lg:col-span-2">
                <div className="sticky top-4 self-start">
                    <h3 className="font-heading text-3xl text-[var(--text-main)] mb-4">Live Preview</h3>
                    <div className="aspect-[2/3] w-full bg-[var(--background)] p-1 rounded-md shadow-lg border border-[var(--border)]">
                        <div className={`grid ${layoutToGridClasses[layout]} gap-1 h-full w-full`}>
                            {panels.map((panel, index) => (
                                <button
                                    key={panel.id}
                                    onClick={() => handleOpenImageEditor(panel)}
                                    disabled={!panel.image || loadingPanels.has(panel.id)}
                                    className={`relative bg-[var(--surface-2)] rounded-sm flex items-center justify-center overflow-hidden group ${getPanelGridClass(layout, index)} disabled:cursor-not-allowed`}
                                >
                                    {panel.image && <ProjectImage imageKey={panel.image} alt={`Panel ${index+1}`} className="w-full h-full object-cover" />}
                                    {loadingPanels.has(panel.id) && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Spinner /></div>}
                                    {!loadingPanels.has(panel.id) && !panel.image && <div className="p-2 text-center"><p className="text-xs font-semibold text-[var(--text-muted)]">Panel {index + 1}</p></div>}
                                    {panel.image && !loadingPanels.has(panel.id) && <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm">Edit</div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
      
      <footer className="flex-shrink-0 bg-[var(--surface-1)]/80 backdrop-blur-lg mt-auto p-4 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              {error && <p className="text-red-500 text-center">{error}</p>}
            </div>
            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
                <button onClick={handleSavePage} disabled={panels.some(p => !p.image) || loadingPanels.size > 0} className="btn text-white bg-[var(--success)] hover:opacity-90">Save Page</button>
            </div>
        </div>
      </footer>

      {editorImageData && (
        <ImageEditorModal
            image={editorImageData.image}
            onClose={() => setEditorImageData(null)}
            onSave={handleSaveImageEdit}
        />
      )}
    </div>
  );
};