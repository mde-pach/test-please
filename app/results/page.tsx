'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TestPreview from '@/components/TestPreview';
import DownloadButton from '@/components/DownloadButton';
import TestCollectionView from '@/components/TestCollectionView';
import { MigrationService } from '@/lib/storage/migration-service';
import type { GeneratedTestFile, APIInfo, TestCollection } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface ResultsData {
  testFiles?: GeneratedTestFile[];
  collection?: TestCollection;
  apiInfo?: APIInfo;
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [activeTab, setActiveTab] = useState<'runner' | 'code'>('runner');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Retrieve results from sessionStorage
    const stored = sessionStorage.getItem('testResults');

    if (!stored) {
      // No results found, redirect to home
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setData(parsed);
    } catch (error) {
      console.error('Failed to parse results:', error);
      router.push('/');
    }
  }, [router]);

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAsProject = async () => {
    setIsSaving(true);
    try {
      const project = await MigrationService.migrateSessionStorageToProject();
      if (project) {
        // Navigate to projects list
        router.push('/projects');
      } else {
        alert('Failed to save project: No data available');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              API Test Suite
            </h1>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSaveAsProject}
                disabled={isSaving}
                loading={isSaving}
                variant="primary"
                size="md"
              >
                {isSaving ? 'Saving...' : 'Save as Project'}
              </Button>
              <Link href="/">
                <Button variant="secondary" size="md">
                  Generate New Tests
                </Button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          {data.collection && data.testFiles && (
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6 max-w-md">
              <button
                onClick={() => setActiveTab('runner')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'runner'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Test Runner
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Generated Code
              </button>
            </div>
          )}
        </div>

        {/* Test Runner View */}
        {activeTab === 'runner' && data.collection && (
          <TestCollectionView collection={data.collection} />
        )}

        {/* Code View */}
        {activeTab === 'code' && data.testFiles && data.apiInfo && (
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {data.apiInfo.title} (v{data.apiInfo.version})
              </h2>
              {data.apiInfo.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {data.apiInfo.description}
                </p>
              )}
              {data.apiInfo.baseUrl && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Base URL: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{data.apiInfo.baseUrl}</code>
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-8 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Test Files:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {data.testFiles.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total Tests:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {data.testFiles.reduce((sum, file) => sum + file.testCount, 0)}
                    </span>
                  </div>
                </div>

                <DownloadButton testFiles={data.testFiles} />
              </div>
            </Card>

            {/* Test Files */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Vitest Test Files
              </h3>

              {data.testFiles.map((file, index) => (
                <TestPreview
                  key={index}
                  testFile={file}
                  onDownload={handleDownloadFile}
                />
              ))}
            </div>

            {/* Instructions */}
            <Card className="mt-12 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-6">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-3">
                How to Use These Test Files
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-primary-800 dark:text-primary-200 text-sm">
                <li>Download the test files using the buttons above</li>
                <li>Add them to your project&apos;s test directory</li>
                <li>Install dependencies: <code className="bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">npm install -D vitest axios</code></li>
                <li>Update the BASE_URL in each test file to point to your API</li>
                <li>Run tests: <code className="bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">npx vitest</code></li>
              </ol>
              <p className="mt-4 text-sm text-primary-700 dark:text-primary-300">
                Note: You can run tests directly in the browser using the &quot;Test Runner&quot; tab above!
              </p>
            </Card>
          </div>
        )}

        {/* Fallback for old format */}
        {!data.collection && !data.testFiles && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No test data available</p>
          </div>
        )}
      </div>
    </main>
  );
}
