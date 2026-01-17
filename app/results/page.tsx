'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TestPreview from '@/components/TestPreview';
import DownloadButton from '@/components/DownloadButton';
import type { GeneratedTestFile, APIInfo } from '@/types';

interface ResultsData {
  testFiles: GeneratedTestFile[];
  apiInfo: APIInfo;
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);

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

  const { testFiles, apiInfo } = data;
  const totalTests = testFiles.reduce((sum, file) => sum + file.testCount, 0);

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Generated Tests
            </h1>
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors"
            >
              Generate New Tests
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {apiInfo.title} (v{apiInfo.version})
            </h2>
            {apiInfo.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {apiInfo.description}
              </p>
            )}
            {apiInfo.baseUrl && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Base URL: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{apiInfo.baseUrl}</code>
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex space-x-8 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Endpoints:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {testFiles.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Tests:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {totalTests}
                  </span>
                </div>
              </div>

              <DownloadButton testFiles={testFiles} />
            </div>
          </div>
        </div>

        {/* Test Files */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Files
          </h3>

          {testFiles.map((file, index) => (
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
            How to Use These Tests
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>Download the test files using the buttons above</li>
            <li>Add them to your project's test directory</li>
            <li>Install dependencies: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">npm install -D vitest axios</code></li>
            <li>Update the BASE_URL in each test file to point to your API</li>
            <li>Run tests: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">npx vitest</code></li>
            <li>Customize tests as needed for your specific requirements</li>
          </ol>
          <p className="mt-4 text-sm text-blue-700 dark:text-blue-300">
            Note: These tests are generated as a starting point. You may need to adjust them based on your authentication requirements, environment setup, and specific API behavior.
          </p>
        </div>
      </div>
    </main>
  );
}
