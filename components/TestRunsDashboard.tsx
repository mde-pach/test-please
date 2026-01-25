'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TestRun {
  id: string;
  name: string | null;
  runType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  createdAt: string;
}

interface TestRunsDashboardProps {
  projectId: string;
}

export default function TestRunsDashboard({ projectId }: TestRunsDashboardProps) {
  const router = useRouter();
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchRuns();

    // Auto-refresh every 3 seconds if enabled and there are active runs
    const interval = setInterval(() => {
      if (autoRefresh && runs.some(r => r.status === 'pending' || r.status === 'running')) {
        fetchRuns();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId, autoRefresh]);

  const fetchRuns = async () => {
    try {
      const response = await fetch(`/api/runs/list?projectId=${projectId}`);
      const data = await response.json();

      if (data.success) {
        setRuns(data.runs);
        setError(null);
      } else {
        setError(data.error || 'Failed to load test runs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test runs');
    } finally {
      setLoading(false);
    }
  };

  const viewRunDetails = (runId: string) => {
    router.push(`/runs/${runId}`);
  };

  const getStatusBadge = (status: TestRun['status']) => {
    const styles = {
      pending: 'bg-gray-800 text-gray-400',
      running: 'bg-blue-900/30 text-blue-400 animate-pulse',
      completed: 'bg-green-900/30 text-green-400',
      failed: 'bg-red-900/30 text-red-400',
      cancelled: 'bg-yellow-900/30 text-yellow-400',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getProgressPercentage = (run: TestRun) => {
    if (run.status === 'pending') return 0;
    if (run.status === 'completed' || run.status === 'failed') return 100;

    // For running status, calculate based on completed tests
    const completed = run.passedTests + run.failedTests + run.errorTests;
    return run.totalTests > 0 ? (completed / run.totalTests) * 100 : 0;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getSuccessRate = (run: TestRun) => {
    const total = run.passedTests + run.failedTests + run.errorTests;
    if (total === 0) return 0;
    return (run.passedTests / total) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-3 text-gray-400">Loading test runs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">No test runs yet</h3>
          <p className="mt-1 text-sm text-gray-500">Run some tests to see results here</p>
        </div>
      </div>
    );
  }

  const activeRuns = runs.filter(r => r.status === 'pending' || r.status === 'running');
  const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'failed' || r.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Auto-refresh toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Test Runs</h3>
        <label className="flex items-center space-x-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
          />
          <span>Auto-refresh</span>
        </label>
      </div>

      {/* Active Runs */}
      {activeRuns.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Active Runs ({activeRuns.length})</h4>
          <div className="space-y-3">
            {activeRuns.map((run) => (
              <div
                key={run.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(run.status)}
                    <span className="text-sm font-medium text-gray-100">
                      {run.name || `Run #${run.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => viewRunDetails(run.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Details →
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{run.passedTests + run.failedTests + run.errorTests} / {run.totalTests} tests completed</span>
                    <span>{getProgressPercentage(run).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(run)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-100">{run.totalTests}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-400">{run.passedTests}</div>
                    <div className="text-xs text-gray-500">Passed</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-400">{run.failedTests}</div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-400">{run.errorTests}</div>
                    <div className="text-xs text-gray-500">Errors</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Runs */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Runs ({completedRuns.length})</h4>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Run
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {completedRuns.map((run) => (
                <tr
                  key={run.id}
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => viewRunDetails(run.id)}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-100">
                      {run.name || `Run #${run.id.slice(0, 8)}`}
                    </div>
                    <div className="text-xs text-gray-500">{run.runType}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(run.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-green-400">{run.passedTests} ✓</span>
                      <span className="text-red-400">{run.failedTests} ✗</span>
                      <span className="text-yellow-400">{run.errorTests} ⚠</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            getSuccessRate(run) >= 80 ? 'bg-green-500' :
                            getSuccessRate(run) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${getSuccessRate(run)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{getSuccessRate(run).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400">{formatDuration(run.duration)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400">
                      {run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewRunDetails(run.id);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
