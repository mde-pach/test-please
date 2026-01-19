'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface TestExecution {
  id: string;
  testId: string;
  testName: string;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    time: number;
  };
  testResults: Array<{
    name: string;
    status: 'pass' | 'fail';
    error?: string;
  }>;
  assertionResults: Array<{
    type: string;
    passed: boolean;
    message: string;
    expected?: any;
    actual?: any;
  }>;
  error?: string;
  executedAt: string;
}

interface TestRun {
  id: string;
  name: string | null;
  runType: string;
  status: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  createdAt: string;
}

export default function RunDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<TestRun | null>(null);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRunDetails();
  }, [runId]);

  const fetchRunDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/runs/${runId}`);
      const data = await response.json();

      if (data.success) {
        setRun(data.run);
        setExecutions(data.executions);
      } else {
        setError(data.error || 'Failed to load run details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load run details');
    } finally {
      setLoading(false);
    }
  };

  const filteredExecutions = executions.filter(exec => {
    if (filterStatus === 'all') return true;
    return exec.status === filterStatus;
  });

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      passed: 'bg-green-900/30 text-green-400',
      failed: 'bg-red-900/30 text-red-400',
      error: 'bg-yellow-900/30 text-yellow-400',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-3 text-gray-400">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Run not found'}</p>
          <Link href="/projects" className="text-blue-400 hover:text-blue-300">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden flex bg-gray-950">
      {/* Left Panel: Test List */}
      <div className="w-96 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <Link href={`/projects/${run.projectId || ''}`} className="text-blue-400 hover:text-blue-300 text-sm flex items-center mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Project
          </Link>
          <h2 className="text-lg font-semibold text-gray-100">{run.name || 'Test Run'}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(run.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-400">{run.passedTests}</div>
              <div className="text-xs text-gray-500">Passed</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-semibold text-red-400">{run.failedTests}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-semibold text-yellow-400">{run.errorTests}</div>
              <div className="text-xs text-gray-500">Errors</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-100">{formatDuration(run.duration || 0)}</div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tests ({executions.length})</option>
            <option value="passed">Passed ({run.passedTests})</option>
            <option value="failed">Failed ({run.failedTests})</option>
            <option value="error">Errors ({run.errorTests})</option>
          </select>
        </div>

        {/* Test List */}
        <div className="flex-1 overflow-auto">
          {filteredExecutions.map((execution) => (
            <button
              key={execution.id}
              onClick={() => setSelectedExecution(execution)}
              className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                selectedExecution?.id === execution.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-100 truncate">
                  {execution.testName}
                </span>
                {getStatusBadge(execution.status)}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{execution.request.method}</span>
                <span>{formatDuration(execution.duration)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Test Details */}
      <div className="flex-1 overflow-auto">
        {selectedExecution ? (
          <div className="p-6 space-y-6">
            {/* Test Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-100">{selectedExecution.testName}</h3>
                {getStatusBadge(selectedExecution.status)}
              </div>
              <p className="text-sm text-gray-400">
                Executed at {new Date(selectedExecution.executedAt).toLocaleString()} •
                Duration: {formatDuration(selectedExecution.duration)}
              </p>
            </div>

            {/* Error Message */}
            {selectedExecution.error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">Error</h4>
                <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">
                  {selectedExecution.error}
                </pre>
              </div>
            )}

            {/* Test Results (Bruno Tests) */}
            {selectedExecution.testResults && selectedExecution.testResults.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-100 mb-3">Test Assertions</h4>
                <div className="space-y-2">
                  {selectedExecution.testResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start space-x-3 p-3 rounded-lg ${
                        result.status === 'pass' ? 'bg-green-900/10' : 'bg-red-900/10'
                      }`}
                    >
                      <span className={result.status === 'pass' ? 'text-green-400' : 'text-red-400'}>
                        {result.status === 'pass' ? '✓' : '✗'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-100">{result.name}</p>
                        {result.error && (
                          <p className="text-xs text-red-400 mt-1 font-mono">{result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                <h4 className="text-sm font-semibold text-gray-100">Request</h4>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedExecution.request.method === 'GET' ? 'bg-blue-900/30 text-blue-400' :
                    selectedExecution.request.method === 'POST' ? 'bg-green-900/30 text-green-400' :
                    selectedExecution.request.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                    selectedExecution.request.method === 'PATCH' ? 'bg-orange-900/30 text-orange-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {selectedExecution.request.method}
                  </span>
                  <span className="ml-3 text-sm text-gray-300 font-mono">{selectedExecution.request.url}</span>
                </div>

                {selectedExecution.request.headers && Object.keys(selectedExecution.request.headers).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Headers:</p>
                    <pre className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedExecution.request.headers, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedExecution.request.body && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Body:</p>
                    <pre className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-x-auto">
                      {typeof selectedExecution.request.body === 'string'
                        ? selectedExecution.request.body
                        : JSON.stringify(selectedExecution.request.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Response */}
            {selectedExecution.response && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-100">Response</h4>
                  <span className={`text-xs font-medium ${
                    selectedExecution.response.status >= 200 && selectedExecution.response.status < 300
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {selectedExecution.response.status} {selectedExecution.response.statusText}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Headers:</p>
                    <pre className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-x-auto">
                      {JSON.stringify(selectedExecution.response.headers, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Body:</p>
                    <pre className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-x-auto max-h-96">
                      {typeof selectedExecution.response.body === 'string'
                        ? selectedExecution.response.body
                        : JSON.stringify(selectedExecution.response.body, null, 2)}
                    </pre>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Response Time: {formatDuration(selectedExecution.response.time)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400">Select a test to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
