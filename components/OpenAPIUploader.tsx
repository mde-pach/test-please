'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ParsedEndpoint, APIInfo } from '@/types';

type TabType = 'url' | 'file';

interface OpenAPIUploaderProps {
  onSuccess?: (endpoints: ParsedEndpoint[], apiInfo: APIInfo) => void;
}

export default function OpenAPIUploader({ onSuccess }: OpenAPIUploaderProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let content: string;

      if (activeTab === 'url') {
        if (!url.trim()) {
          setError('Please enter a valid URL');
          setLoading(false);
          return;
        }
        content = url.trim();
      } else {
        if (!file) {
          setError('Please select a file');
          setLoading(false);
          return;
        }

        content = await file.text();
      }

      // Step 1: Parse the OpenAPI spec
      const parseResponse = await fetch('/api/parse-openapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: activeTab,
          content,
        }),
      });

      const parseData = await parseResponse.json();

      if (!parseData.success) {
        setError(parseData.error || 'Failed to parse OpenAPI specification');
        setLoading(false);
        return;
      }

      // Step 2: Generate tests
      const generateResponse = await fetch('/api/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: parseData.endpoints,
          apiInfo: parseData.apiInfo,
          options: {
            includeEdgeCases: true,
            maxTestsPerEndpoint: 6,
          },
        }),
      });

      const generateData = await generateResponse.json();

      if (!generateData.success) {
        setError(generateData.error || 'Failed to generate test files');
        setLoading(false);
        return;
      }

      // Store results in sessionStorage and navigate to results page
      sessionStorage.setItem('testResults', JSON.stringify({
        collection: generateData.collection,
        testFiles: generateData.testFiles,
        apiInfo: parseData.apiInfo,
      }));

      router.push('/results');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Upload OpenAPI Specification
      </h2>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          URL
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'file'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {activeTab === 'url' ? (
          <div className="mb-6">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              OpenAPI Specification URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/openapi.json"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter the URL to your OpenAPI 3.x specification (JSON or YAML)
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              OpenAPI Specification File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {file ? (
                  <span className="text-gray-700 dark:text-gray-300">
                    {file.name}
                  </span>
                ) : (
                  <>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      JSON or YAML file
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating tests...
            </span>
          ) : (
            'Generate Tests'
          )}
        </button>
      </form>
    </div>
  );
}
