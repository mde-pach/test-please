'use client';

interface TestFilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: 'all' | 'contract' | 'story';
  onCategoryChange: (category: 'all' | 'contract' | 'story') => void;
  endpointFilter: string;
  onEndpointChange: (endpoint: string) => void;
  groupBy: 'none' | 'endpoint' | 'category';
  onGroupByChange: (groupBy: 'none' | 'endpoint' | 'category') => void;
  uniqueEndpoints: string[];
}

export default function TestFilterPanel({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  endpointFilter,
  onEndpointChange,
  groupBy,
  onGroupByChange,
  uniqueEndpoints,
}: TestFilterPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filters
      </h2>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tests..."
            className="w-full px-3 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Test Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as 'all' | 'contract' | 'story')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All Categories</option>
          <option value="contract">Contract Tests</option>
          <option value="story">Story Tests</option>
        </select>
      </div>

      {/* Endpoint Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Endpoint
        </label>
        <select
          value={endpointFilter}
          onChange={(e) => onEndpointChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All Endpoints</option>
          {uniqueEndpoints.map((endpoint) => (
            <option key={endpoint} value={endpoint}>
              {endpoint}
            </option>
          ))}
        </select>
      </div>

      {/* Group By */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Group By
        </label>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as 'none' | 'endpoint' | 'category')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="none">No Grouping</option>
          <option value="endpoint">By Endpoint</option>
          <option value="category">By Category</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(searchQuery || categoryFilter !== 'all' || endpointFilter !== 'all') && (
        <button
          onClick={() => {
            onSearchChange('');
            onCategoryChange('all');
            onEndpointChange('all');
          }}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
