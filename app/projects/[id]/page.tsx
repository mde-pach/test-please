'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TestRunsDashboard from '@/components/TestRunsDashboard';

interface Test {
  id: string;
  name: string;
  description?: string;
  category: 'contract' | 'story';
  testType: 'success' | 'error' | 'validation' | 'edge-case';
  endpointPath?: string;
  method?: string;
  tags?: string[];
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  tests: Test[];
}

interface Project {
  id: string;
  name: string;
  description?: string;
  apiInfo: {
    title: string;
    version: string;
    baseUrl: string;
  };
  collections: Collection[];
  environments: any[];
  createdAt: string;
  updatedAt: string;
}

type Tab = 'tests' | 'runs' | 'settings';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tests');
  const [error, setError] = useState<string | null>(null);

  // Test selection and filtering
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'all' | 'selected' | 'collection'>('all');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const getAllTests = (): Test[] => {
    if (!project) return [];
    return project.collections.flatMap(col => col.tests);
  };

  const getFilteredTests = (): Test[] => {
    let tests = getAllTests();

    // Search filter
    if (searchQuery) {
      tests = tests.filter(test =>
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.endpointPath?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      tests = tests.filter(test => test.category === categoryFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      tests = tests.filter(test => test.method === methodFilter);
    }

    return tests;
  };

  const toggleTestSelection = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const toggleSelectAll = () => {
    const filteredTests = getFilteredTests();
    if (selectedTests.size === filteredTests.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(filteredTests.map(t => t.id)));
    }
  };

  const executeTests = async (testIds: string[], runName: string) => {
    try {
      setExecuting(true);

      const response = await fetch('/api/runs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          testIds,
          runType: executionMode,
          name: runName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Test run created! Run ID: ${data.runId}\n\nTests are executing in the background. Switch to the "Runs" tab to see progress.`);
        setActiveTab('runs');
      } else {
        alert('Failed to create test run: ' + data.error);
      }
    } catch (err: any) {
      alert('Failed to execute tests: ' + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleRunAll = () => {
    const allTests = getAllTests();
    if (allTests.length === 0) {
      alert('No tests available to run');
      return;
    }
    setExecutionMode('all');
    executeTests(allTests.map(t => t.id), 'Run All Tests');
  };

  const handleRunSelected = () => {
    if (selectedTests.size === 0) {
      alert('Please select at least one test to run');
      return;
    }
    setExecutionMode('selected');
    executeTests(Array.from(selectedTests), `Run ${selectedTests.size} Selected Tests`);
  };

  const handleRunFiltered = () => {
    const filteredTests = getFilteredTests();
    if (filteredTests.length === 0) {
      alert('No tests match the current filters');
      return;
    }
    setExecutionMode('collection');
    executeTests(filteredTests.map(t => t.id), 'Run Filtered Tests');
  };

  const handleRunCollection = (collectionId: string, collectionName: string) => {
    const collection = project?.collections.find(c => c.id === collectionId);
    if (!collection || collection.tests.length === 0) {
      alert('No tests in this collection');
      return;
    }
    setExecutionMode('collection');
    executeTests(collection.tests.map(t => t.id), `Run Collection: ${collectionName}`);
  };

  const filteredTests = getFilteredTests();
  const allMethods = [...new Set(getAllTests().map(t => t.method).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-3 text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
          <Link href="/projects" className="text-blue-400 hover:text-blue-300">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/projects" className="text-gray-400 hover:text-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-400 mt-1">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {project.apiInfo.title} v{project.apiInfo.version}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'tests'
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
            }`}
          >
            Tests ({getAllTests().length})
          </button>
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'runs'
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
            }`}
          >
            Runs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'tests' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="contract">Contract</option>
                  <option value="story">Story</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  {allMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRunFiltered}
                  disabled={executing || filteredTests.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Run Filtered ({filteredTests.length})
                </button>
                <button
                  onClick={handleRunSelected}
                  disabled={executing || selectedTests.size === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Run Selected ({selectedTests.size})
                </button>
                <button
                  onClick={handleRunAll}
                  disabled={executing || getAllTests().length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Run All
                </button>
              </div>
            </div>

            {selectedTests.size > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {selectedTests.size} test{selectedTests.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedTests(new Set())}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          {/* Tests Table */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {filteredTests.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-400">
                    {searchQuery || categoryFilter !== 'all' || methodFilter !== 'all'
                      ? 'No tests match the current filters'
                      : 'No tests in this project'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={selectedTests.size === filteredTests.length && filteredTests.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Test Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredTests.map((test) => (
                      <tr
                        key={test.id}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTests.has(test.id)}
                            onChange={() => toggleTestSelection(test.id)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-100">
                              {test.name}
                            </span>
                            {test.description && (
                              <span className="text-xs text-gray-500 mt-1">
                                {test.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-300 font-mono">
                            {test.endpointPath || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {test.method && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              test.method === 'GET' ? 'bg-blue-900/30 text-blue-400' :
                              test.method === 'POST' ? 'bg-green-900/30 text-green-400' :
                              test.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                              test.method === 'PATCH' ? 'bg-orange-900/30 text-orange-400' :
                              test.method === 'DELETE' ? 'bg-red-900/30 text-red-400' :
                              'bg-gray-800 text-gray-400'
                            }`}>
                              {test.method}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            test.category === 'contract' ? 'bg-purple-900/30 text-purple-400' : 'bg-indigo-900/30 text-indigo-400'
                          }`}>
                            {test.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400">
                            {test.testType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-900 border-t border-gray-800 px-6 py-3">
            <p className="text-xs text-gray-500">
              Showing {filteredTests.length} of {getAllTests().length} tests
            </p>
          </div>
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <TestRunsDashboard projectId={projectId} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Project Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                <input
                  type="text"
                  value={project.apiInfo.baseUrl}
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Version</label>
                <input
                  type="text"
                  value={project.apiInfo.version}
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
