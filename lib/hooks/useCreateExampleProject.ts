import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getExampleOpenAPISpec } from '@/lib/example-openapi-spec';
import { parseOpenAPISpec } from '@/lib/openapi-parser';
import { getStorageService } from '@/lib/storage/storage-service';
import type { Project } from '@/types/project';

export function useCreateExampleProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExampleProject = async (): Promise<Project | null> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get example spec
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const spec = getExampleOpenAPISpec(baseUrl);

      // Step 2: Parse OpenAPI spec
      const { endpoints, apiInfo } = await parseOpenAPISpec(spec);

      // Step 3: Generate test collection via API
      const generateResponse = await fetch('/api/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints,
          apiInfo,
          options: {
            includeEdgeCases: true,
            maxTestsPerEndpoint: 6,
          },
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate tests');
      }

      const generateData = await generateResponse.json();
      if (!generateData.success) {
        throw new Error(generateData.error || 'Failed to generate tests');
      }

      // Step 4: Create project with collection
      const storage = getStorageService();
      const project = await storage.createProject({
        name: 'Example Todo API Project',
        description: 'A demonstration project showcasing the OpenAPI Test Platform with a sample Todo API',
        apiInfo: {
          ...apiInfo,
          baseUrl: baseUrl,
        },
        spec: {
          source: 'url',
          content: JSON.stringify(spec),
          parsedAt: new Date().toISOString(),
        },
        collections: [generateData.collection],
        executionHistory: [],
        metadata: {
          tags: ['example', 'demo', 'todo-api'],
          favorite: false,
        },
      });

      // Step 5: Navigate to project detail page
      router.push(`/projects/${project.id}`);

      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create example project';
      setError(errorMessage);
      console.error('Error creating example project:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createExampleProject, loading, error };
}
