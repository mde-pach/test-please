'use client';

import Link from 'next/link';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  onExport: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  onDelete,
  onExport,
  onToggleFavorite,
}: ProjectCardProps) {
  const totalTests = project.collections.reduce(
    (sum, collection) => sum + collection.tests.length,
    0
  );

  const lastUpdated = new Date(project.updatedAt);
  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getTimeAgo = () => {
    if (daysSinceUpdate === 0) return 'Today';
    if (daysSinceUpdate === 1) return 'Yesterday';
    if (daysSinceUpdate < 7) return `${daysSinceUpdate} days ago`;
    if (daysSinceUpdate < 30) return `${Math.floor(daysSinceUpdate / 7)} weeks ago`;
    return `${Math.floor(daysSinceUpdate / 30)} months ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 group"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
          </Link>
          <button
            onClick={() => onToggleFavorite(project.id)}
            className="ml-2 text-gray-400 hover:text-yellow-500 transition-colors"
            aria-label="Toggle favorite"
          >
            <svg
              className="w-5 h-5"
              fill={project.metadata?.favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* API Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">API:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {project.apiInfo.title}
            </span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">
              v{project.apiInfo.version}
            </span>
          </div>
          {project.apiInfo.baseUrl && (
            <div className="flex items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Base URL:</span>
              <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300 truncate max-w-xs">
                {project.apiInfo.baseUrl}
              </code>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Collections:</span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
              {project.collections.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tests:</span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
              {totalTests}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Runs:</span>
            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
              {project.executionHistory.length}
            </span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Updated {getTimeAgo()}
        </div>

        {/* Tags */}
        {project.metadata?.tags && project.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Open Project →
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onExport(project.id)}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Export project"
            title="Export project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          <button
            onClick={() => onDelete(project.id)}
            className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            aria-label="Delete project"
            title="Delete project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
