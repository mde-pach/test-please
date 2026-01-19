'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProjectCard from '@/components/ProjectCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import type { Project } from '@/types/project';
import { getStorageService } from '@/lib/storage/storage-service';
import { useCreateExampleProject } from '@/lib/hooks/useCreateExampleProject';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { createExampleProject, loading: creatingExample, error: createError } = useCreateExampleProject();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const storage = getStorageService();
      const allProjects = await storage.getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExample = async () => {
    const project = await createExampleProject();
    if (!project && createError) {
      alert(`Failed to create example project: ${createError}`);
    }
    // Navigation happens inside the hook
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const storage = getStorageService();
      await storage.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleExport = async (projectId: string) => {
    try {
      const storage = getStorageService();
      const jsonData = await storage.exportProject(projectId);

      // Download as JSON file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-${projectId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project. Please try again.');
    }
  };

  const handleToggleFavorite = async (projectId: string) => {
    try {
      const storage = getStorageService();
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      await storage.updateProject(projectId, {
        metadata: {
          ...project.metadata,
          favorite: !project.metadata?.favorite,
        },
      });

      setProjects(projects.map(p =>
        p.id === projectId
          ? { ...p, metadata: { ...p.metadata, favorite: !p.metadata?.favorite } }
          : p
      ));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.apiInfo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                My Projects
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your API test projects and collections
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateExample}
                loading={creatingExample}
                variant="success"
                size="md"
                leftIcon={
                  !creatingExample && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                }
              >
                Try Example
              </Button>
              <Link href="/">
                <Button variant="primary" size="md">
                  Create New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          {projects.length > 0 && (
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onExport={handleExport}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Get started by creating a new project or try our example'}
            </p>
            {!searchQuery && (
              <div className="mt-6 flex gap-3 justify-center">
                <Button
                  onClick={handleCreateExample}
                  loading={creatingExample}
                  variant="success"
                  size="md"
                  leftIcon={
                    !creatingExample && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )
                  }
                >
                  Try Example API
                </Button>
                <Link href="/">
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    Create New Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
