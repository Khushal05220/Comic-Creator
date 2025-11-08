import React, { useState } from 'react';
import { Project, ComicPage, Asset, AssetType, Character, Location, ImageSource, PageLayout, ImageData } from '../types';
import { PageEditor } from './PageEditor';
import { PromptEditor } from './PromptEditor';
import { PlusIcon, ExportIcon, MagicIcon, BackIcon } from './common/Icons';
import { exportProjectToPdf } from '../services/pdfExporter';
import { Spinner } from './common/Spinner';
import { StoryGeneratorModal } from './StoryGeneratorModal';
import { AssetCreator } from './AssetCreator';
import { StoryboardEditor } from './StoryboardEditor';
import { SidePanel } from './common/SidePanel';
import { ImageEditorModal } from './ImageEditorModal';
import { Modal } from './common/Modal';
import { layoutToGridClasses, getPanelGridClass } from '../services/layoutUtils';
import { ProjectImage } from './ProjectImage';
import * as dbService from '../services/dbService';
import { saveImage } from '../services/dbService';

interface ProjectWorkspaceProps {
  project: Project;
  updateProject: (project: Project) => void;
  onBackToDashboard: () => void;
}

type WorkspaceTab = 'PAGES' | 'ASSETS' | 'STORYBOARD' | 'AI_SETTINGS';
type AssetTab = 'CHARACTERS' | 'LOCATIONS';
type PageViewMode = 'grid' | 'list';

const AssetGrid: React.FC<{ assets: Asset[], assetType: AssetType, onImageClick: (asset: Asset) => void }> = ({ assets, assetType, onImageClick }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
      {assets.map(asset => (
        <div key={asset.id} className="text-center group">
          <button 
            onClick={() => onImageClick(asset)}
            className="relative aspect-[3/4] bg-[var(--surface-2)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border)] group-hover:border-[var(--primary)] transition-all group-hover:shadow-md w-full disabled:cursor-not-allowed"
            disabled={!asset.image}
          >
            <ProjectImage imageKey={asset.image} alt={asset.name} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                Edit
            </div>
          </button>
          <p className="font-semibold mt-3 text-[var(--text-main)] truncate">{asset.name}</p>
        </div>
      ))}
      {assets.length === 0 && <p className="text-[var(--text-muted)] col-span-full text-center py-16">No {assetType.toLowerCase()}s created yet.</p>}
    </div>
);


export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, updateProject, onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('PAGES');
  const [activeAssetTab, setActiveAssetTab] = useState<AssetTab>('CHARACTERS');
  const [assetCreatorOpen, setAssetCreatorOpen] = useState<AssetType | null>(null);

  const [editorMode, setEditorMode] = useState<'PAGE_EDITOR' | null>(null);
  const [pageEditorData, setPageEditorData] = useState<ComicPage | 'new' | null>(null);
  
  const [pageViewMode, setPageViewMode] = useState<PageViewMode>('list');

  const [showStoryGenerator, setShowStoryGenerator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [imageEditorState, setImageEditorState] = useState<{
      source: ImageSource;
      image: ImageData;
    } | null>(null);

  const handleOpenPageEditor = (page: ComicPage | 'new') => {
    setPageEditorData(page);
    setEditorMode('PAGE_EDITOR');
  };

  const addAsset = (asset: Asset, type: AssetType) => {
    switch(type) {
      case 'Character':
        updateProject({ ...project, characters: [...project.characters, asset as Character] });
        break;
      case 'Location':
        updateProject({ ...project, locations: [...project.locations, asset as Location] });
        break;
    }
    setAssetCreatorOpen(null);
  };

  const savePage = (page: ComicPage) => {
    const isNewPage = !project.pages.some(p => p.id === page.id);
    let updatedPages;
    if (isNewPage) {
        updatedPages = [...project.pages, page].sort((a,b) => a.pageNumber - b.pageNumber);
    } else {
        updatedPages = project.pages.map(p => p.id === page.id ? page : p);
    }
    updateProject({ ...project, pages: updatedPages });
    setEditorMode(null);
    setPageEditorData(null);
  };
  
  const savePages = (newPages: ComicPage[]) => {
    const highestPageNumber = project.pages.reduce((max, p) => Math.max(max, p.pageNumber), 0);
    const numberedNewPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: highestPageNumber + index + 1,
    }));

    const allPages = [...project.pages, ...numberedNewPages].sort((a,b) => a.pageNumber - b.pageNumber);
    updateProject({ ...project, pages: allPages });
    setShowStoryGenerator(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportProjectToPdf(project);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("There was an error exporting your comic. Please check the console for details.");
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleOpenAssetImageEditor = async (asset: Asset) => {
      if (asset.image) {
        const imageData = await dbService.getImage(asset.image);
        if (imageData) {
            const assetType = project.characters.some(c => c.id === asset.id) ? 'Character' : 'Location';
            setImageEditorState({
                source: { type: 'asset', assetType, assetId: asset.id },
                image: imageData
            });
        }
      }
  };
  
  const handleSaveImageEdit = async (newImage: ImageData) => {
    if (!imageEditorState) return;
    const { source } = imageEditorState;

    const newImageKey = await saveImage(newImage);

    if (source.type === 'asset') {
        const key = source.assetType === 'Character' ? 'characters' : 'locations';
        const updatedAssets = project[key].map(asset => 
            asset.id === source.assetId ? { ...asset, image: newImageKey } : asset
        );
        updateProject({ ...project, [key]: updatedAssets });
    }
    setImageEditorState(null);
  };

  const TabButton: React.FC<{ tabId: WorkspaceTab, children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-3 font-semibold text-sm transition-colors rounded-t-lg border-b-2 ${
        activeTab === tabId
        ? 'border-[var(--primary)] text-[var(--primary)]'
        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-hover)]'
      }`}
    >
      {children}
    </button>
  );

  const AssetTabButton: React.FC<{ tabId: AssetTab, children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveAssetTab(tabId)}
      className={`px-3 py-1.5 text-sm font-semibold rounded-md ${
        activeAssetTab === tabId
        ? 'bg-[var(--primary)] text-white'
        : 'bg-[var(--surface-2)] text-[var(--text-main)] hover:bg-[var(--border)]'
      }`}
    >
      {children}
    </button>
  );

  const ViewModeButton: React.FC<{ mode: PageViewMode, children: React.ReactNode }> = ({ mode, children }) => (
    <button onClick={() => setPageViewMode(mode)} className={`p-2 rounded-md ${pageViewMode === mode ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-main)] hover:bg-[var(--border)]'}`}>
        {children}
    </button>
  )
  
  const renderContent = () => {
    switch(activeTab) {
      case 'PAGES':
        return (
          <section>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <h3 className="font-heading text-4xl">Comic Pages</h3>
                <div className="flex items-center gap-2 p-1 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                    <ViewModeButton mode="list">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </ViewModeButton>
                    <ViewModeButton mode="grid">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </ViewModeButton>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={handleExport} disabled={project.pages.length === 0 || isExporting} className="btn btn-secondary">
                  {isExporting ? <Spinner/> : <ExportIcon className="w-5 h-5"/>}
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
                <button onClick={() => setShowStoryGenerator(true)} disabled={project.characters.length === 0} className="btn btn-secondary">
                  <MagicIcon className="w-5 h-5"/> Generate from Story
                </button>
                <button onClick={() => handleOpenPageEditor('new')} className="btn btn-primary">
                  <PlusIcon className="w-5 h-5"/> Add Page
                </button>
              </div>
            </div>
            
            <div className={pageViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-8'}>
                {project.pages.map(page => (
                  <div key={page.id} className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg text-[var(--text-main)]">Page {page.pageNumber}</h4>
                        <button onClick={() => handleOpenPageEditor(page)} className="btn btn-secondary btn-sm">Edit Page</button>
                    </div>
                    <div className={`mx-auto ${pageViewMode === 'list' ? 'max-w-lg' : 'w-full'}`}>
                        <div className="aspect-[2/3] w-full bg-[var(--background)] p-1 rounded-md shadow-inner border border-[var(--border)]">
                            <div className={`grid ${layoutToGridClasses[page.layout]} gap-1 h-full`}>
                                {page.panels.map((panel, index) => (
                                    <div key={panel.id} className={`relative bg-[var(--surface-2)] rounded-sm flex items-center justify-center overflow-hidden ${getPanelGridClass(page.layout, index)}`}>
                                        <ProjectImage imageKey={panel.image} alt={panel.description} className="w-full h-full object-cover" />
                                        {panel.dialogue && (
                                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] p-1 rounded shadow-lg backdrop-blur-sm border border-white/20">
                                            {panel.dialogue}
                                        </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
            {project.pages.length === 0 && <p className="text-[var(--text-muted)] text-center py-16">No pages created yet.</p>}
          </section>
        );
      case 'ASSETS':
        const currentAssetType = activeAssetTab === 'CHARACTERS' ? 'Character' : 'Location';
        return (
          <section>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 p-1 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                    <AssetTabButton tabId="CHARACTERS">Characters</AssetTabButton>
                    <AssetTabButton tabId="LOCATIONS">Locations / Backgrounds</AssetTabButton>
                </div>
                <button onClick={() => setAssetCreatorOpen(currentAssetType)} className="btn btn-primary">
                    <PlusIcon className="w-5 h-5"/> Add {currentAssetType}
                </button>
            </div>
            {activeAssetTab === 'CHARACTERS' && <AssetGrid assets={project.characters} assetType="Character" onImageClick={handleOpenAssetImageEditor} />}
            {activeAssetTab === 'LOCATIONS' && <AssetGrid assets={project.locations} assetType="Location" onImageClick={handleOpenAssetImageEditor} />}
          </section>
        );
      case 'STORYBOARD':
        return <StoryboardEditor project={project} updateProject={updateProject} />;
      case 'AI_SETTINGS':
        return <PromptEditor project={project} updateProject={updateProject} />;
      default:
        return null;
    }
  }

  // Render Editor Mode if active
  if (editorMode === 'PAGE_EDITOR' && pageEditorData) {
    return (
        <PageEditor 
            project={project} 
            onSave={savePage} 
            onCancel={() => {
              setEditorMode(null);
              setPageEditorData(null);
            }}
            key={typeof pageEditorData === 'object' ? pageEditorData?.id : 'new'}
            pageToEdit={typeof pageEditorData === 'object' ? pageEditorData : undefined}
        />
    )
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center border-b border-[var(--border)]">
         <nav className="flex items-center gap-4">
            <TabButton tabId="PAGES">Pages</TabButton>
            <TabButton tabId="ASSETS">Assets</TabButton>
            <TabButton tabId="STORYBOARD">Storyboard</TabButton>
            <TabButton tabId="AI_SETTINGS">AI Settings</TabButton>
         </nav>
         <button onClick={onBackToDashboard} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors pr-2">
            <BackIcon className="w-4 h-4" />
            Back to Dashboard
        </button>
       </div>

      <div className="bg-[var(--surface-1)] p-4 sm:p-8 rounded-xl min-h-[60vh] border border-[var(--border)] shadow-sm">
        {renderContent()}
      </div>

       <SidePanel 
          isOpen={!!assetCreatorOpen}
          onClose={() => setAssetCreatorOpen(null)}
          title={assetCreatorOpen === 'Character' ? 'Create New Character' : 'Create New Location / Background'}
       >
        {assetCreatorOpen && (
            <AssetCreator 
                assetType={assetCreatorOpen}
                projectStyle={project.style} 
                promptTemplate={project.promptSettings[assetCreatorOpen.toLowerCase() as keyof typeof project.promptSettings]} 
                onSave={(asset) => addAsset(asset, assetCreatorOpen)} 
                onCancel={() => setAssetCreatorOpen(null)} 
            />
        )}
       </SidePanel>
      
      {showStoryGenerator && (
        <Modal onClose={() => setShowStoryGenerator(false)}>
          <StoryGeneratorModal 
            project={project}
            onSave={savePages}
            onCancel={() => setShowStoryGenerator(false)}
          />
        </Modal>
      )}
      {imageEditorState && (
        <ImageEditorModal
            image={imageEditorState.image}
            onClose={() => setImageEditorState(null)}
            onSave={handleSaveImageEdit}
        />
      )}
    </div>
  );
};