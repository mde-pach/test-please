'use client';

import JSZip from 'jszip';
import type { GeneratedTestFile } from '@/types';

interface DownloadButtonProps {
  testFiles: GeneratedTestFile[];
}

export default function DownloadButton({ testFiles }: DownloadButtonProps) {
  const downloadAsZip = async () => {
    const zip = new JSZip();

    // Add all test files to the zip
    testFiles.forEach((file) => {
      zip.file(file.filename, file.content);
    });

    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'api-tests.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadAsZip}
      className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-md"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download All Tests as ZIP
    </button>
  );
}
