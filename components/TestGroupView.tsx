'use client';

import { useState } from 'react';
import type { APITest, TestExecution } from '@/types/test-format';
import type { Project } from '@/types/project';
import { TestRunner } from '@/lib/test-runner';
import StoryTestRunner from './StoryTestRunner';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface TestGroupViewProps {
  tests: APITest[];
  groupBy: 'none' | 'endpoint' | 'category';
  project: Project;
  onRefresh: () => void;
}

interface TestGroup {
  name: string;
  tests: APITest[];
}

export default function TestGroupView({ tests, groupBy, project, onRefresh }: TestGroupViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [executionResults, setExecutionResults] = useState<Map<string, TestExecution>>(new Map());
  const [selectedTest, setSelectedTest] = useState<{ test: APITest; execution: TestExecution } | null>(null);

  const testRunner = new TestRunner();

  // Group tests based on groupBy prop
  const getGroupedTests = (): TestGroup[] => {
    if (groupBy === 'none') {
      return [{ name: 'All Tests', tests }];
    }

    const groups = new Map<string, APITest[]>();

    tests.forEach(test => {
      let groupName: string;

      if (groupBy === 'endpoint') {
        groupName = test.metadata?.endpointPath || 'Unknown Endpoint';
      } else if (groupBy === 'category') {
        groupName = test.category === 'contract' ? 'Contract Tests' : 'Story Tests';
      } else {
        groupName = 'All Tests';
      }

      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(test);
    });

    return Array.from(groups.entries()).map(([name, tests]) => ({ name, tests }));
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const executeTest = async (test: APITest) => {
    setRunningTests(prev => new Set(prev).add(test.id));

    try {
      const execution = await testRunner.executeTest(test);
      setExecutionResults(prev => new Map(prev).set(test.id, execution));
      setSelectedTest({ test, execution });
    } catch (error) {
      console.error('Failed to execute test:', error);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(test.id);
        return newSet;
      });
    }
  };

  const getTestStatusIcon = (testId: string) => {
    const result = executionResults.get(testId);
    if (runningTests.has(testId)) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      );
    }
    if (!result) return null;

    if (result.status === 'passed') {
      return (
        <svg className="h-5 w-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else if (result.status === 'failed') {
      return (
        <svg className="h-5 w-5 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
  };

  const groupedTests = getGroupedTests();

  if (tests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tests found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your filters or create new tests
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* Test Groups */}
      <div className="space-y-4">
        {groupedTests.map(group => {
          const isExpanded = groupBy === 'none' || expandedGroups.has(group.name);

          return (
            <Card key={group.name} className="overflow-hidden p-0">
              {/* Group Header */}
              {groupBy !== 'none' && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({group.tests.length} test{group.tests.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </button>
              )}

              {/* Tests List */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {group.tests.map((test, index) => (
                    <div
                      key={test.id}
                      className={`px-6 py-4 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            {getTestStatusIcon(test.id)}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {test.name}
                              </h4>
                              {test.description && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                  {test.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <Badge
                                  variant={test.category === 'contract' ? 'default' : 'info'}
                                  size="sm"
                                >
                                  {test.category}
                                </Badge>
                                <span>{test.request.method}</span>
                                <span className="truncate">{test.request.url}</span>
                                {test.steps && test.steps.length > 0 && (
                                  <span className="inline-flex items-center text-info-600 dark:text-info-400">
                                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {test.steps.length} steps
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <Button
                            onClick={() => executeTest(test)}
                            disabled={runningTests.has(test.id)}
                            loading={runningTests.has(test.id)}
                            variant="secondary"
                            size="sm"
                          >
                            {runningTests.has(test.id) ? 'Running...' : 'Run Test'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Test Execution Details Modal */}
      {selectedTest && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTest(null)}
          size="xl"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Test Execution Results
            </h3>
          </div>
          <div className="p-6">
              {selectedTest.test.category === 'story' && selectedTest.test.steps ? (
                <StoryTestRunner
                  test={selectedTest.test}
                  execution={selectedTest.execution}
                />
              ) : (
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</h4>
                    <Badge
                      variant={
                        selectedTest.execution.status === 'passed'
                          ? 'success'
                          : selectedTest.execution.status === 'failed'
                          ? 'danger'
                          : 'warning'
                      }
                      size="md"
                    >
                      {selectedTest.execution.status.toUpperCase()}
                    </Badge>
                    <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                      {selectedTest.execution.duration}ms
                    </span>
                  </div>

                  {/* Request */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request</h4>
                    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(selectedTest.execution.request, null, 2)}
                    </pre>
                  </div>

                  {/* Response */}
                  {selectedTest.execution.response && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response</h4>
                      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(selectedTest.execution.response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Assertions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assertions</h4>
                    <div className="space-y-2">
                      {selectedTest.execution.assertionResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            result.passed
                              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                              : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
                          }`}
                        >
                          <div className="flex items-start">
                            {result.passed ? (
                              <svg className="h-5 w-5 text-success-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-danger-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {result.assertion.description}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {result.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {selectedTest.execution.error && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Error</h4>
                      <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4 rounded-lg">
                        <p className="text-sm text-danger-800 dark:text-danger-200">
                          {selectedTest.execution.error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
}
