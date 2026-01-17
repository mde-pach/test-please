'use client';

import type { TestExecution } from '@/types';

interface TestExecutionResultProps {
  execution: TestExecution;
}

export default function TestExecutionResult({ execution }: TestExecutionResultProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'error':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(execution.status)}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(execution.status)}
          <span className="font-semibold uppercase text-sm">{execution.status}</span>
        </div>
        <span className="text-sm">{execution.duration}ms</span>
      </div>

      {/* Request Info */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2">Request</h4>
        <div className="text-xs font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
          <div className="font-semibold">{execution.request.method} {execution.request.url}</div>
          {execution.request.body && (
            <pre className="mt-2 overflow-x-auto">
              {JSON.stringify(execution.request.body, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Response Info */}
      {execution.response && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm mb-2">Response</h4>
          <div className="text-xs font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
            <div className="font-semibold mb-2">
              Status: {execution.response.status} {execution.response.statusText}
            </div>
            <pre className="overflow-x-auto max-h-40">
              {JSON.stringify(execution.response.body, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Assertions */}
      {execution.assertionResults && execution.assertionResults.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">
            Assertions ({execution.assertionResults.filter(a => a.passed).length}/{execution.assertionResults.length} passed)
          </h4>
          <div className="space-y-2">
            {execution.assertionResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 text-xs ${
                  result.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                <span className="mt-0.5">
                  {result.passed ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <div>{result.message}</div>
                  {!result.passed && result.expected !== undefined && (
                    <div className="mt-1 text-xs opacity-75">
                      Expected: {JSON.stringify(result.expected)} | Got: {JSON.stringify(result.actual)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {execution.error && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2">Error</h4>
          <div className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded font-mono">
            {execution.error}
          </div>
        </div>
      )}
    </div>
  );
}
