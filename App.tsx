
import React, { useState, useCallback, useEffect } from 'react';
import { Project, View } from './types';
import { ART_STYLES, DEFAULT_CHARACTER_PROMPT, DEFAULT_LOCATION_PROMPT, DEFAULT_PANEL_PROMPT } from './constants';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import useLocalStorage from './hooks/useLocalStorage';
import { MagicIcon } from './components/common/Icons';
import useTheme, { Theme } from './hooks/useTheme';
import { initDB, saveImage } from './services/dbService';
import { getSeedProjects, getSeedImages } from './services/seedData';

const ThemeToggle: React.FC<{ theme: Theme, toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--background)]"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};


const Header: React.FC<{ onBackToDashboard: () => void, theme: Theme, toggleTheme: () => void }> = ({ onBackToDashboard, theme, toggleTheme }) => {
  return (
    <header className="bg-[var(--surface-1)]/80 backdrop-blur-lg sticky top-0 z-50 p-4 border-b border-[var(--border)] flex justify-between items-center">
      <button onClick={onBackToDashboard} className="flex items-center gap-3 cursor-pointer">
        <div className="bg-gradient-to-br from-[var(--primary)] to-blue-400 p-2 rounded-lg shadow-md">
           <MagicIcon className="w-6 h-6 text-white"/>
        </div>
        <h1 className="font-heading text-3xl tracking-wider text-[var(--text-main)]">Comics Creator</h1>
      </button>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
};

const App: React.FC = () => {
  const [projects, setProjects] = useLocalStorage<Project[]>('comic-creator-projects', []);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [view, setView] = useState<View>('DASHBOARD');
  const [theme, toggleTheme] = useTheme();

  // Handle seeding data on first load
  useEffect(() => {
    const seedDatabase = async () => {
        await initDB();
        const seedProjects = getSeedProjects();
        const seedImages = getSeedImages();
        
        const seededProject = { ...seedProjects[0] };
        
        // Save images and replace placeholders with keys
        const zephyrSheetKey = await saveImage(seedImages.zephyrSheet);
        seededProject.characters[0].image = zephyrSheetKey;

        const zephyrFlyingKey = await saveImage(seedImages.zephyrFlying);
        seededProject.pages[0].panels[0].image = zephyrFlyingKey;

        const zephyrConcernedKey = await saveImage(seedImages.zephyrConcerned);
        seededProject.pages[0].panels[1].image = zephyrConcernedKey;
        
        const neoVeridiaKey = await saveImage(seedImages.neoVeridia);
        seededProject.locations[0].image = neoVeridiaKey;
        
        setProjects([seededProject]);
        window.localStorage.setItem('db_seeded', 'true');
    };

    const isSeeded = window.localStorage.getItem('db_seeded');
    if (!isSeeded) {
        seedDatabase();
    }
  }, []);

  const createNewProject = (title: string, style: string) => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title,
      style,
      characters: [],
      locations: [],
      storyboard: '',
      pages: [],
      promptSettings: {
        character: DEFAULT_CHARACTER_PROMPT,
        panel: DEFAULT_PANEL_PROMPT,
        location: DEFAULT_LOCATION_PROMPT,
      }
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setView('PROJECT_WORKSPACE');
  };

  const selectProject = (id: string) => {
    setActiveProjectId(id);
    setView('PROJECT_WORKSPACE');
  };
  
  const deleteProject = (id: string) => {
    // Note: This doesn't delete images from IndexedDB to keep it simple,
    // but a production app would need a garbage collection strategy.
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setView('DASHBOARD');
    }
  };

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }, [setProjects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  
  const handleBackToDashboard = () => {
    setActiveProjectId(null);
    setView('DASHBOARD');
  }

  const renderContent = () => {
    switch (view) {
      case 'PROJECT_WORKSPACE':
        return activeProject ? (
          <ProjectWorkspace 
            project={activeProject} 
            updateProject={updateProject}
            onBackToDashboard={handleBackToDashboard}
          />
        ) : (
          <div className="text-center p-8 animate-fade-in">
            <p className="text-[var(--text-muted)]">No project selected. Go back to dashboard to select or create a project.</p>
            <button onClick={handleBackToDashboard} className="mt-4 btn btn-primary">Go to Dashboard</button>
          </div>
        );
      case 'DASHBOARD':
      default:
        return <ProjectDashboard 
          projects={projects} 
          onCreateProject={createNewProject} 
          onSelectProject={selectProject}
          onDeleteProject={deleteProject}
          artStyles={ART_STYLES}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] font-sans">
      <Header onBackToDashboard={handleBackToDashboard} theme={theme} toggleTheme={toggleTheme}/>
      <main className="p-4 sm:p-6 md:p-8">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;