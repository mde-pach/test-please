'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CollectionTable } from '@/components/collections/CollectionTable';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  collections: Collection[];
  _count: {
    collections: number;
    testRuns: number;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  baseUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tests: number;
    testRuns: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseUrl: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch project details
  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        alert('Project not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('Failed to fetch project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh project data
        await fetchProject();
        setFormData({ name: '', description: '', baseUrl: '' });
        setShowCreateForm(false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-gray-400 hover:text-gray-300">
          Projects
        </Link>
        <span className="text-gray-600 mx-2">/</span>
        <span className="text-white">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-gray-400">{project.description}</p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + New Collection
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Collections</div>
            <div className="text-2xl font-bold text-white mt-1">
              {project._count.collections}
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Test Runs</div>
            <div className="text-2xl font-bold text-white mt-1">
              {project._count.testRuns}
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm">Total Tests</div>
            <div className="text-2xl font-bold text-white mt-1">
              {project.collections.reduce((sum, c) => sum + (c._count?.tests || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Collection</h2>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My API Collection"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A brief description..."
              />
            </div>
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Base URL (optional)
              </label>
              <input
                type="url"
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="https://api.example.com"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Collection'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Collections</h2>
        </div>
        <CollectionTable collections={project.collections} projectId={projectId} />
      </div>
    </div>
  );
}
