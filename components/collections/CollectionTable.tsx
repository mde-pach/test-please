'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  baseUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    tests: number;
    testRuns: number;
  };
}

interface CollectionTableProps {
  collections: Collection[];
  projectId: string;
}

export function CollectionTable({ collections, projectId }: CollectionTableProps) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">No collections yet</div>
        <p className="text-gray-500">Create a collection or generate one from an OpenAPI spec</p>
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
              Base URL
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Tests
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
          {collections.map((collection) => (
            <tr key={collection.id} className="hover:bg-gray-900 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/collections/${collection.id}`}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  {collection.name}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-400 truncate max-w-md">
                  {collection.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-400 font-mono truncate max-w-xs">
                  {collection.baseUrl || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-300">
                  {collection._count?.tests || 0}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/collections/${collection.id}`}
                  className="text-blue-400 hover:text-blue-300 mr-4"
                >
                  View
                </Link>
                <button
                  className="text-red-400 hover:text-red-300"
                  onClick={() => {
                    // TODO: Implement delete functionality
                    console.log('Delete collection', collection.id);
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
