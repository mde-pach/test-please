'use client';

import { useState } from 'react';
import type { APITest, TestExecution } from '@/types';
import TestExecutionResult from './TestExecutionResult';

interface TestItemProps {
  test: APITest;
  onExecute?: (execution: TestExecution) => void;
}

export default function TestItem({ test, onExecute }: TestItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [execution, setExecution] = useState<TestExecution | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/execute-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test }),
      });

      const data = await response.json();

      if (data.success && data.execution) {
        setExecution(data.execution);
        setIsExpanded(true);
        onExecute?.(data.execution);
      } else {
        console.error('Test execution failed:', data.error);
      }
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'validation':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'edge-case':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getTestTypeColor(test.testType)}`}>
                {test.testType}
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                {test.request.method}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {test.name}
            </h3>
            {test.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {test.description}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
              {test.request.url}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </span>
              ) : (
                'Run Test'
              )}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          {/* Test Details */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Test Configuration</h4>
            <div className="text-xs space-y-2">
              {test.request.headers && Object.keys(test.request.headers).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Headers:</span>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded font-mono overflow-x-auto">
                    {JSON.stringify(test.request.headers, null, 2)}
                  </pre>
                </div>
              )}

              {test.request.queryParams && Object.keys(test.request.queryParams).length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Query Params:</span>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded font-mono overflow-x-auto">
                    {JSON.stringify(test.request.queryParams, null, 2)}
                  </pre>
                </div>
              )}

              {test.request.body && test.request.body.type !== 'none' && test.request.body.data && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Body ({test.request.body.type}):</span>
                  <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded font-mono overflow-x-auto">
                    {JSON.stringify(test.request.body.data, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Assertions ({test.assertions.length}):</span>
                <ul className="mt-1 space-y-1">
                  {test.assertions.map((assertion, index) => (
                    <li key={index} className="p-2 bg-white dark:bg-gray-800 rounded">
                      <div className="font-semibold">{assertion.description}</div>
                      <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                        {assertion.type} {assertion.field ? `(${assertion.field})` : ''} {assertion.operator} {assertion.value !== undefined ? JSON.stringify(assertion.value) : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Execution Result */}
          {execution && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Last Execution Result</h4>
              <TestExecutionResult execution={execution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
