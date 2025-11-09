
import React, { useState } from 'react';
import { Project } from '../types';
import { PlusIcon, TrashIcon } from './common/Icons';
import { Modal } from './common/Modal';

interface ProjectDashboardProps {
  projects: Project[];
  onCreateProject: (title: string, style: string) => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  artStyles: string[];
}

const CreateProjectForm: React.FC<{ artStyles: string[], onCreateProject: (title: string, style: string) => void, onCancel: () => void }> = ({ artStyles, onCreateProject, onCancel }) => {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState(artStyles[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateProject(title.trim(), style);
    }
  };
  
  return (
    <form onSubmit={handleCreate} className="space-y-6">
      <h3 className="font-heading text-4xl text-[var(--text-main)]">Create a New Comic</h3>
      
      <div className="space-y-2">
        <label htmlFor="comic-title" className="block text-sm font-medium text-[var(--text-muted)]">
          Comic Title
        </label>
        <input
          id="comic-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 'Chronicles of Zephyr'"
          className="input-base"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
         <label htmlFor="art-style" className="block text-sm font-medium text-[var(--text-muted)]">
          Art Style
        </label>
        <select
          id="art-style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="input-base"
        >
          {artStyles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="btn btn-primary"
        >
          Create Project
        </button>
      </div>
    </form>
  );
};

interface DemoProject {
  name: string;
  url: string;
  thumbnail?: string;
}

const DemoProjectsSection: React.FC = () => {
  const demoProjects: DemoProject[] = [
    { 
      name: 'Heart Break', 
      url: 'https://drive.google.com/uc?export=download&id=1qUlF8XAySgcSm3ijY7udncsYdwHr3FNW',
      thumbnail: 'https://drive.google.com/uc?export=view&id=1zrh__xQYodyVtZhntYOXZ0KxzfAFiVGO'
    },
    { 
      name: 'Samurai', 
      url: 'https://drive.google.com/uc?export=download&id=1Bkqbx9YSWs3HIEzRjmy08PCiDwYU-sOa',
      thumbnail: 'https://drive.google.com/uc?export=view&id=1WyON2POUTECIXflOeXsmdT8bJusn24sC'
    },
    { 
      name: 'Neel', 
      url: 'https://drive.google.com/uc?export=download&id=1LApD9MoKZvy0wUlEE1miRW4jzRMsAnK7',
      thumbnail: 'https://drive.google.com/uc?export=view&id=1OzDhgUHQzzHZmuDqzzsbaciMv_wDmlW5'
    }
  ];

  return (
    <div className="pt-8 border-t border-[var(--border)]">
      <h3 className="text-lg font-semibold text-[var(--text-muted)] mb-4">
        Some demo projects created using this app with a single prompt
      </h3>
      <div className="flex flex-wrap gap-6">
        {demoProjects.map(demo => (
          <a
            key={demo.name}
            href={demo.url}
            title={`Download ${demo.name} PDF`}
            className="group relative w-40 h-56 bg-[var(--surface-1)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
          >
            {demo.thumbnail ? (
              <>
                <img src={demo.thumbnail} alt={demo.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex flex-col justify-end">
                  <h4 className="font-bold text-lg text-white">{demo.name}</h4>
                  <p className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">Download PDF</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-bold text-xl mt-2 text-[var(--text-main)]">{demo.name}</span>
                <span className="text-xs text-[var(--text-muted)]">PDF</span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};


export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onCreateProject, onSelectProject, onDeleteProject, artStyles }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-grow space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-5xl tracking-wide">My Projects</h2>
        </div>

        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)}>
            <CreateProjectForm 
              artStyles={artStyles}
              onCreateProject={(title, style) => {
                onCreateProject(title, style);
                setShowCreateModal(false);
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </Modal>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] text-[var(--primary)] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group min-h-[200px]"
          >
            <div className="w-16 h-16 mb-4 bg-white dark:bg-[var(--surface-1)] rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <PlusIcon className="w-8 h-8 transition-colors" />
            </div>
            <span className="font-semibold text-lg">New Project</span>
          </button>

          {projects.map(project => (
            <div key={project.id} className="bg-[var(--surface-1)] rounded-xl group transition-all duration-300 relative border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg hover:shadow-blue-500/10 min-h-[200px] flex flex-col">
              <div className="p-6 cursor-pointer h-full flex flex-col justify-between flex-1" onClick={() => onSelectProject(project.id)}>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{project.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{project.style} Style</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)]">{project.characters.length} Characters</p>
                  <p className="text-sm text-[var(--text-muted)]">{project.pages.length} Pages</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete Project"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="col-span-full text-center py-16">
            <h3 className="text-xl font-semibold text-[var(--text-muted)]">Your creative journey begins here.</h3>
            <p className="text-[var(--text-muted)] mt-2">Click 'New Project' to start your first comic!</p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <DemoProjectsSection />
      </div>
    </div>
  );
};
