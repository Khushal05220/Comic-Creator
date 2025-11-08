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


export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onCreateProject, onSelectProject, onDeleteProject, artStyles }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-8">
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
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] text-[var(--primary)] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group min-h-[200px]"
        >
          <div className="w-16 h-16 mb-4 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
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
  );
};