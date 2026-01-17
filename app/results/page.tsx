'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TestPreview from '@/components/TestPreview';
import DownloadButton from '@/components/DownloadButton';
import TestCollectionView from '@/components/TestCollectionView';
import type { GeneratedTestFile, APIInfo, TestCollection } from '@/types';

interface ResultsData {
  testFiles?: GeneratedTestFile[];
  collection?: TestCollection;
  apiInfo?: APIInfo;
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [activeTab, setActiveTab] = useState<'runner' | 'code'>('runner');

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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
            >
              Generate New Tests
            </Link>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
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
            </div>

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
            <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                How to Use These Test Files
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
                <li>Download the test files using the buttons above</li>
                <li>Add them to your project&apos;s test directory</li>
                <li>Install dependencies: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">npm install -D vitest axios</code></li>
                <li>Update the BASE_URL in each test file to point to your API</li>
                <li>Run tests: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">npx vitest</code></li>
              </ol>
              <p className="mt-4 text-sm text-blue-700 dark:text-blue-300">
                Note: You can run tests directly in the browser using the &quot;Test Runner&quot; tab above!
              </p>
            </div>
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
