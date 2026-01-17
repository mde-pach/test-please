'use client';

import { useState } from 'react';
import type { TestCollection, TestExecution, CollectionExecutionResponse } from '@/types';
import TestItem from './TestItem';

interface TestCollectionViewProps {
  collection: TestCollection;
}

export default function TestCollectionView({ collection }: TestCollectionViewProps) {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [summary, setSummary] = useState<CollectionExecutionResponse['summary'] | null>(null);

  const handleRunAll = async () => {
    setIsRunningAll(true);
    setExecutions([]);
    setSummary(null);

    try {
      const response = await fetch('/api/execute-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          tests: collection.tests,
        }),
      });

      const data: CollectionExecutionResponse = await response.json();

      if (data.success) {
        setExecutions(data.executions);
        setSummary(data.summary);
      } else {
        console.error('Collection execution failed:', data.error);
      }
    } catch (error) {
      console.error('Error running collection:', error);
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleTestExecute = (execution: TestExecution) => {
    // Update the executions array with the new execution
    setExecutions(prev => {
      const filtered = prev.filter(e => e.testId !== execution.testId);
      return [...filtered, execution];
    });
  };

  return (
    <div className="space-y-6">
      {/* Collection Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {collection.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">API:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {collection.apiInfo.title} v{collection.apiInfo.version}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Base URL:</span>
                <span className="ml-2 font-mono text-sm text-gray-900 dark:text-white">
                  {collection.apiInfo.baseUrl}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Tests:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {collection.tests.length}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="ml-4 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed shadow-md"
          >
            {isRunningAll ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running All Tests...
              </span>
            ) : (
              'Run All Tests'
            )}
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Execution Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.passed}</div>
                <div className="text-sm text-green-700 dark:text-green-500">Passed</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.failed}</div>
                <div className="text-sm text-red-700 dark:text-red-500">Failed</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.errors}</div>
                <div className="text-sm text-orange-700 dark:text-orange-500">Errors</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.duration}ms</div>
                <div className="text-sm text-blue-700 dark:text-blue-500">Duration</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Tests ({collection.tests.length})
        </h3>
        <div className="space-y-3">
          {collection.tests.map((test) => (
            <TestItem key={test.id} test={test} onExecute={handleTestExecute} />
          ))}
        </div>
      </div>
    </div>
  );
}
