'use client';

import { useState } from 'react';
import type { Project } from '@/types/project';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ProjectSettingsProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => Promise<void>;
  onDelete: () => Promise<void>;
  onExport: () => Promise<void>;
}

export default function ProjectSettings({
  project,
  onUpdate,
  onDelete,
  onExport,
}: ProjectSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [baseUrl, setBaseUrl] = useState(project.apiInfo.baseUrl || '');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>(
    project.metadata?.customHeaders || {}
  );
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        name,
        description,
        apiInfo: {
          ...project.apiInfo,
          baseUrl,
        },
        metadata: {
          ...project.metadata,
          customHeaders,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(project.name);
    setDescription(project.description || '');
    setBaseUrl(project.apiInfo.baseUrl || '');
    setCustomHeaders(project.metadata?.customHeaders || {});
    setIsEditing(false);
  };

  const addHeader = () => {
    if (!newHeaderKey.trim()) return;

    setCustomHeaders({
      ...customHeaders,
      [newHeaderKey]: newHeaderValue,
    });
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const updated = { ...customHeaders };
    delete updated[key];
    setCustomHeaders(updated);
  };

  return (
    <div className="max-w-4xl">
      <div className="space-y-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              General Settings
            </h3>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
              >
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              {isEditing ? (
                <Input
                  type="text"
                  label="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name
                  </label>
                  <p className="text-gray-900 dark:text-white">{project.name}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project description (optional)"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {project.description || <span className="text-gray-400 italic">No description</span>}
                </p>
              )}
            </div>

            {/* Base URL */}
            <div>
              {isEditing ? (
                <div>
                  <Input
                    type="url"
                    label="Base URL"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Default base URL for all test requests
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Base URL
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {project.apiInfo.baseUrl || <span className="text-gray-400 italic">Not set</span>}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Default base URL for all test requests
                  </p>
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  loading={isSaving}
                  variant="primary"
                  size="md"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isSaving}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* API Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            API Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">API Title:</span>
              <span className="text-gray-900 dark:text-white font-medium">{project.apiInfo.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version:</span>
              <span className="text-gray-900 dark:text-white font-medium">{project.apiInfo.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Spec Source:</span>
              <span className="text-gray-900 dark:text-white font-medium capitalize">{project.spec.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Parsed At:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {new Date(project.spec.parsedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Custom Headers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Custom Headers
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Headers that will be included in all test requests
          </p>

          {/* Existing Headers */}
          {Object.keys(customHeaders).length > 0 && (
            <div className="space-y-2 mb-4">
              {Object.entries(customHeaders).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <code className="text-sm text-gray-900 dark:text-white font-medium">{key}</code>
                    <span className="mx-2 text-gray-400">:</span>
                    <code className="text-sm text-gray-600 dark:text-gray-400">{value}</code>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeHeader(key)}
                      className="ml-2 text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Header */}
          {isEditing && (
            <div className="flex gap-2">
              <Input
                type="text"
                value={newHeaderKey}
                onChange={(e) => setNewHeaderKey(e.target.value)}
                placeholder="Header name (e.g., Authorization)"
              />
              <Input
                type="text"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.target.value)}
                placeholder="Header value"
              />
              <Button
                onClick={addHeader}
                disabled={!newHeaderKey.trim()}
                variant="primary"
                size="md"
              >
                Add
              </Button>
            </div>
          )}
        </Card>

        {/* Project Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Project Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Collections</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.collections.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.collections.reduce((acc, col) => acc + col.tests.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Executions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.executionHistory.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={onExport}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Export Project
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Download project as JSON file
                  </p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={onDelete}
              className="w-full flex items-center justify-between px-4 py-3 border border-danger-300 dark:border-danger-600 rounded-md hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
            >
              <div className="flex items-center">
                <svg className="h-5 w-5 text-danger-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-danger-900 dark:text-danger-200">
                    Delete Project
                  </p>
                  <p className="text-xs text-danger-700 dark:text-danger-400">
                    Permanently delete this project and all its data
                  </p>
                </div>
              </div>
              <svg className="h-5 w-5 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
