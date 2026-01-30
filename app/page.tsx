'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specContent, setSpecContent] = useState('');
  const [projectName, setProjectName] = useState('');
  const [inputMethod, setInputMethod] = useState<'file' | 'url'>('url');
  const [specUrl, setSpecUrl] = useState('');
  const [showcaseLoading, setShowcaseLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setSpecContent(content);
        setProjectName(parsed.info?.title || 'API Test Project');
        setError(null);
      } catch (err) {
        setError('Invalid JSON file. Please upload a valid OpenAPI specification.');
      }
    };
    reader.readAsText(file);
  };

  const handleUrlFetch = async () => {
    if (!specUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(specUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      const parsed = JSON.parse(content);
      setSpecContent(content);
      setProjectName(parsed.info?.title || 'API Test Project');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch OpenAPI specification from URL');
    } finally {
      setLoading(false);
    }
  };

  const handleShowcase = async () => {
    try {
      setShowcaseLoading(true);
      setError(null);

      const response = await fetch('/api/showcase');
      const data = await response.json();

      if (data.success) {
        router.push(`/projects/${data.projectId}`);
      } else {
        setError(data.error || 'Failed to load showcase project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load showcase project');
    } finally {
      setShowcaseLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!specContent) {
      setError('Please provide an OpenAPI specification first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/projects/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: specContent,
          projectName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/projects/${data.projectId}`);
      } else {
        setError(data.error || 'Failed to generate project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            API Test Platform
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Generate comprehensive API tests from your OpenAPI specification.
            Powered by AI.
          </p>

          {/* Showcase Button */}
          <div className="mt-6">
            <button
              onClick={handleShowcase}
              disabled={showcaseLoading}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
            >
              {showcaseLoading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Showcase Project
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">See a working example with the Todo API</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-blue-500 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-400">
              Uses Claude AI to generate intelligent test files with comprehensive coverage
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-blue-500 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Structured Format</h3>
            <p className="text-sm text-gray-400">
              Tests stored in a structured format for easy execution and management
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-blue-500 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Async Execution</h3>
            <p className="text-sm text-gray-400">
              Background test execution with real-time progress tracking
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Provide OpenAPI Specification</h2>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My API Project"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Input Method Tabs */}
            <div>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setInputMethod('url')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  URL
                </button>
                <button
                  onClick={() => setInputMethod('file')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  File Upload
                </button>
              </div>

              {inputMethod === 'url' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    OpenAPI Specification URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={specUrl}
                      onChange={(e) => setSpecUrl(e.target.value)}
                      placeholder="https://api.example.com/openapi.json"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleUrlFetch}
                      disabled={loading || !specUrl.trim()}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Fetch
                    </button>
                  </div>
                  {specContent && (
                    <p className="text-sm text-green-400">✓ Specification loaded from URL</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OpenAPI Specification File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center w-full bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg px-6 py-12 cursor-pointer hover:border-gray-600 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-400">
                          {specContent ? (
                            <span className="text-green-400">✓ Specification loaded</span>
                          ) : (
                            <>Click to upload or drag and drop</>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">OpenAPI 3.0 JSON/YAML file</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !specContent}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                  Generating Tests...
                </>
              ) : (
                'Generate Project'
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Need an example? Try the{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setInputMethod('url');
                  setSpecUrl(window.location.origin + '/api/example/openapi.json');
                }}
                className="text-blue-400 hover:text-blue-300"
              >
                sample Todo API spec
              </a>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have projects?{' '}
            <a href="/projects" className="text-blue-400 hover:text-blue-300">
              View all projects
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
