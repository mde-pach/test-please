'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    collections: number;
    testRuns: number;
  };
}

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">No projects yet</div>
        <p className="text-gray-500">Create your first project to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-gray-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Description
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Collections
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Test Runs
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Updated
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-950 divide-y divide-gray-800">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-900 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-400 truncate max-w-md">
                  {project.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-300">
                  {project._count.collections}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-300">
                  {project._count.testRuns}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-blue-400 hover:text-blue-300 mr-4"
                >
                  View
                </Link>
                <button
                  className="text-red-400 hover:text-red-300"
                  onClick={() => {
                    // TODO: Implement delete functionality
                    console.log('Delete project', project.id);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
