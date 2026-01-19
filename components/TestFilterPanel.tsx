'use client';

import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

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
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filters
      </h2>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          label="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tests..."
          leftIcon={
            <svg
              className="h-4 w-4 text-gray-400"
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
          }
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <Select
          label="Test Category"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as 'all' | 'contract' | 'story')}
        >
          <option value="all">All Categories</option>
          <option value="contract">Contract Tests</option>
          <option value="story">Story Tests</option>
        </Select>
      </div>

      {/* Endpoint Filter */}
      <div className="mb-6">
        <Select
          label="Endpoint"
          value={endpointFilter}
          onChange={(e) => onEndpointChange(e.target.value)}
        >
          <option value="all">All Endpoints</option>
          {uniqueEndpoints.map((endpoint) => (
            <option key={endpoint} value={endpoint}>
              {endpoint}
            </option>
          ))}
        </Select>
      </div>

      {/* Group By */}
      <div className="mb-6">
        <Select
          label="Group By"
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as 'none' | 'endpoint' | 'category')}
        >
          <option value="none">No Grouping</option>
          <option value="endpoint">By Endpoint</option>
          <option value="category">By Category</option>
        </Select>
      </div>

      {/* Clear Filters */}
      {(searchQuery || categoryFilter !== 'all' || endpointFilter !== 'all') && (
        <Button
          onClick={() => {
            onSearchChange('');
            onCategoryChange('all');
            onEndpointChange('all');
          }}
          variant="secondary"
          size="md"
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </Card>
  );
}
