'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Project } from '@/types/project';
import type { APITest, TestExecution } from '@/types/test-format';
import { getStorageService } from '@/lib/storage/storage-service';
import TestFilterPanel from '@/components/TestFilterPanel';
import TestGroupView from '@/components/TestGroupView';
import ExecutionHistoryView from '@/components/ExecutionHistoryView';
import ProjectSettings from '@/components/ProjectSettings';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type Tab = 'tests' | 'history' | 'settings';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tests');
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'contract' | 'story'>('all');
  const [endpointFilter, setEndpointFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'endpoint' | 'category'>('endpoint');

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const storage = getStorageService();
      const loadedProject = await storage.getProject(projectId);

      if (!loadedProject) {
        setError('Project not found');
        return;
      }

      setProject(loadedProject);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdate = async (updates: Partial<Project>) => {
    try {
      const storage = getStorageService();
      const updatedProject = await storage.updateProject(projectId, updates);
      setProject(updatedProject);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const storage = getStorageService();
      await storage.deleteProject(projectId);
      router.push('/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleExportProject = async () => {
    try {
      const storage = getStorageService();
      const jsonData = await storage.exportProject(projectId);

      // Download as JSON file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project?.name.replace(/\s+/g, '-').toLowerCase()}-${projectId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export project:', err);
      alert('Failed to export project. Please try again.');
    }
  };

  // Get all tests from all collections
  const getAllTests = (): APITest[] => {
    if (!project) return [];
    return project.collections.flatMap(collection => collection.tests);
  };

  // Get unique endpoints
  const getUniqueEndpoints = (): string[] => {
    const tests = getAllTests();
    const endpoints = new Set<string>();
    tests.forEach(test => {
      if (test.metadata?.endpointPath) {
        endpoints.add(test.metadata.endpointPath);
      }
    });
    return Array.from(endpoints).sort();
  };

  // Filter tests based on current filters
  const getFilteredTests = (): APITest[] => {
    let tests = getAllTests();

    // Search filter
    if (searchQuery) {
      tests = tests.filter(test =>
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      tests = tests.filter(test => test.category === categoryFilter);
    }

    // Endpoint filter
    if (endpointFilter !== 'all') {
      tests = tests.filter(test => test.metadata?.endpointPath === endpointFilter);
    }

    return tests;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-danger-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            {error || 'Project not found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The project you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <div className="mt-6">
            <Link href="/projects">
              <Button variant="primary" size="md">
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredTests = getFilteredTests();
  const uniqueEndpoints = getUniqueEndpoints();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/projects" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Projects
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 dark:text-white font-medium">{project.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {project.description}
                </p>
              )}
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{project.apiInfo.title} v{project.apiInfo.version}</span>
                <span>•</span>
                <span>{getAllTests().length} tests</span>
                <span>•</span>
                <span>{project.collections.length} collection{project.collections.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleExportProject}
                variant="secondary"
                size="md"
              >
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tests'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Tests
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'tests' && (
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <div className="w-64 flex-shrink-0">
              <TestFilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                endpointFilter={endpointFilter}
                onEndpointChange={setEndpointFilter}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                uniqueEndpoints={uniqueEndpoints}
              />
            </div>

            {/* Tests View */}
            <div className="flex-1">
              <TestGroupView
                tests={filteredTests}
                groupBy={groupBy}
                project={project}
                onRefresh={loadProject}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <ExecutionHistoryView
            history={project.executionHistory}
            projectId={project.id}
          />
        )}

        {activeTab === 'settings' && (
          <ProjectSettings
            project={project}
            onUpdate={handleProjectUpdate}
            onDelete={handleDeleteProject}
            onExport={handleExportProject}
          />
        )}
      </div>
    </main>
  );
}
