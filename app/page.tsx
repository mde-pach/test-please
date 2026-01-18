'use client';

import OpenAPIUploader from '@/components/OpenAPIUploader';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            OpenAPI Test Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Automatically generate comprehensive test cases from your OpenAPI specifications using AI.
            Start by uploading a spec, or visit{' '}
            <a href="/projects" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Projects
            </a>{' '}
            to try our example.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-primary-600 dark:text-primary-400 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle className="mb-2">AI-Powered</CardTitle>
              <CardDescription>
                Uses Claude AI to generate intelligent test cases covering success, error, and edge cases
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-primary-600 dark:text-primary-400 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="mb-2">Vitest Ready</CardTitle>
              <CardDescription>
                Generates ready-to-run Vitest test files with proper assertions and error handling
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-primary-600 dark:text-primary-400 mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <CardTitle className="mb-2">Comprehensive Coverage</CardTitle>
              <CardDescription>
                Validates request parameters, response schemas, status codes, and data types
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Upload Component */}
        <OpenAPIUploader />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Supports OpenAPI 3.x specifications in JSON or YAML format
          </p>
          <p className="mt-2">
            Example:{' '}
            <a
              href="https://petstore3.swagger.io/api/v3/openapi.json"
              className="text-primary-600 dark:text-primary-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Petstore API
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
