'use client';

import type { APITest, TestExecution } from '@/types/test-format';

interface StoryTestRunnerProps {
  test: APITest;
  execution: TestExecution & { stepResults?: any[] };
}

export default function StoryTestRunner({ test, execution }: StoryTestRunnerProps) {
  const stepResults = execution.stepResults || [];

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {test.name}
          </h3>
          {test.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {test.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            execution.status === 'passed'
              ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
              : execution.status === 'failed'
              ? 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'
              : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
          }`}>
            {execution.status.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {execution.duration}ms
          </span>
        </div>
      </div>

      {/* Error Message */}
      {execution.error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-danger-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-danger-800 dark:text-danger-200">
                Execution Error
              </h4>
              <p className="mt-1 text-sm text-danger-700 dark:text-danger-300">
                {execution.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Steps Timeline */}
      {test.steps && test.steps.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Test Steps ({test.steps.length})
          </h4>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Steps */}
            <div className="space-y-6">
              {test.steps.map((step, index) => {
                const stepResult = stepResults.find(sr => sr.stepId === step.id);
                const stepStatus = stepResult?.status || 'pending';

                return (
                  <div key={step.id} className="relative pl-12">
                    {/* Step Number/Status Icon */}
                    <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 ${
                      stepStatus === 'passed'
                        ? 'bg-success-500'
                        : stepStatus === 'failed'
                        ? 'bg-danger-500'
                        : stepStatus === 'error'
                        ? 'bg-warning-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      {stepStatus === 'passed' ? (
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepStatus === 'failed' || stepStatus === 'error' ? (
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="text-white font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Step {step.order}: {step.name}
                          </h5>
                          {step.description && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {step.description}
                            </p>
                          )}
                        </div>
                        {stepResult && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {stepResult.duration}ms
                          </span>
                        )}
                      </div>

                      {/* Request */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 text-xs mb-2">
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            step.request.method === 'GET'
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                              : step.request.method === 'POST'
                              ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                              : step.request.method === 'PUT'
                              ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
                              : step.request.method === 'DELETE'
                              ? 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {step.request.method}
                          </span>
                          <code className="text-gray-700 dark:text-gray-300 truncate">
                            {step.request.url}
                          </code>
                        </div>
                      </div>

                      {/* Extracted Variables */}
                      {step.extractVariables && step.extractVariables.length > 0 && stepResult?.extractedVariables && (
                        <div className="mb-3">
                          <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Extracted Variables:
                          </h6>
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-2 space-y-1">
                            {step.extractVariables.map(extraction => (
                              <div key={extraction.name} className="flex items-center justify-between text-xs">
                                <span className="font-medium text-purple-800 dark:text-purple-200">
                                  {extraction.name}
                                </span>
                                <code className="text-purple-600 dark:text-purple-400">
                                  {JSON.stringify(stepResult.extractedVariables[extraction.name])}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assertions */}
                      {stepResult && stepResult.assertionResults && stepResult.assertionResults.length > 0 && (
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assertions:
                          </h6>
                          <div className="space-y-1">
                            {stepResult.assertionResults.map((result: any, assertionIndex: number) => (
                              <div
                                key={assertionIndex}
                                className={`flex items-start p-2 rounded text-xs ${
                                  result.passed
                                    ? 'bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-200'
                                    : 'bg-danger-50 dark:bg-danger-900/20 text-danger-800 dark:text-danger-200'
                                }`}
                              >
                                {result.passed ? (
                                  <svg className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                <div>
                                  <div className="font-medium">{result.assertion.description}</div>
                                  <div className="mt-0.5 opacity-75">{result.message}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Variable Flow Summary */}
      {stepResults.length > 0 && stepResults.some(sr => sr.extractedVariables && Object.keys(sr.extractedVariables).length > 0) && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Variable Flow
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="space-y-2">
              {stepResults.map((stepResult, index) => {
                if (!stepResult.extractedVariables || Object.keys(stepResult.extractedVariables).length === 0) {
                  return null;
                }

                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 w-24">
                      Step {index + 1}
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {Object.entries(stepResult.extractedVariables).map(([key, value]) => (
                        <div
                          key={key}
                          className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs"
                        >
                          <span className="font-medium">{key}:</span>
                          <code className="ml-1">{JSON.stringify(value)}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overall Assertions Summary */}
      {execution.assertionResults && execution.assertionResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Overall Test Assertions
          </h4>
          <div className="space-y-2">
            {execution.assertionResults.map((result, index) => (
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
      )}
    </div>
  );
}
