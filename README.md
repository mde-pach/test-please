# OpenAPI Test Generator

A Next.js application that automatically generates TypeScript test cases from OpenAPI specifications using AI (Anthropic's Claude API via Vercel AI SDK).

## Features

- **AI-Powered Test Generation**: Uses Claude AI to analyze your API and generate comprehensive test cases
- **Multiple Input Methods**: Upload OpenAPI spec via file or URL
- **Comprehensive Coverage**: Generates tests for success scenarios, validation errors, edge cases, and error handling
- **Vitest Ready**: Outputs ready-to-run Vitest test files with proper assertions
- **Syntax Highlighting**: Preview generated tests with syntax highlighting
- **Easy Download**: Download individual test files or all as a ZIP archive

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd openapi-test-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Upload Your OpenAPI Specification

Choose one of two methods:

- **URL**: Enter the URL to your OpenAPI specification (JSON or YAML)
- **File Upload**: Upload your OpenAPI spec file directly

### 2. Generate Tests

Click "Generate Tests" and wait while the AI analyzes your API and generates comprehensive test cases.

### 3. Preview and Download

- Review the generated test files with syntax highlighting
- Copy individual tests to your clipboard
- Download individual test files or all tests as a ZIP

### 4. Use the Tests

1. Add the downloaded test files to your project
2. Install test dependencies:
   ```bash
   npm install -D vitest axios
   ```
3. Update the `BASE_URL` in each test file to point to your API
4. Run the tests:
   ```bash
   npx vitest
   ```

## Project Structure

```
/
├── app/
│   ├── page.tsx                 # Homepage with upload form
│   ├── layout.tsx               # Root layout
│   ├── api/
│   │   ├── parse-openapi/
│   │   │   └── route.ts         # Parse and validate OpenAPI
│   │   └── generate-tests/
│   │       └── route.ts         # Generate tests using AI
│   └── results/
│       └── page.tsx             # Show generated tests
├── components/
│   ├── OpenAPIUploader.tsx      # File/URL input component
│   ├── TestPreview.tsx          # Display generated tests
│   └── DownloadButton.tsx       # Download test files
├── lib/
│   ├── openapi-parser.ts        # Parse OpenAPI specs
│   ├── test-generator.ts        # Core test generation logic
│   ├── ai-client.ts             # AI SDK integration
│   └── templates/
│       └── vitest-template.ts   # Test file templates
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React with Tailwind CSS
- **AI**: Vercel AI SDK with Anthropic Claude
- **OpenAPI Parsing**: swagger-parser
- **Test Framework**: Vitest (for generated tests)
- **Code Highlighting**: react-syntax-highlighter

## How It Works

1. **Parse**: The OpenAPI specification is parsed and validated
2. **Analyze**: Each endpoint is analyzed by Claude AI to understand:
   - Required vs optional parameters
   - Valid data types and constraints
   - Expected responses
   - Potential edge cases
3. **Generate**: AI generates test cases covering:
   - Happy path scenarios
   - Validation errors
   - Edge cases
   - Error handling
4. **Template**: Test cases are formatted into Vitest test files
5. **Download**: Users can preview and download the generated tests

## Example Generated Test

```typescript
import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BASE_URL = 'https://api.example.com';

describe('POST /users - Create User', () => {
  it('should create a user with valid data', async () => {
    const response = await axios.post(`${BASE_URL}/users`, {
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.name).toBe('John Doe');
  });

  it('should return 400 when email is missing', async () => {
    try {
      await axios.post(`${BASE_URL}/users`, {
        name: 'John Doe'
      });
      throw new Error('Request should have failed');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toHaveProperty('error');
    }
  });
});
```

## Limitations

- Supports OpenAPI 3.x only (not 2.0/Swagger)
- Generates Vitest tests only (Jest, Mocha support planned)
- Does not handle authentication setup
- Does not execute tests (generation only)
- AI generation requires internet connection

## Future Enhancements

- Support for multiple test frameworks (Jest, Mocha, Pytest)
- Authentication strategy handling
- Test execution and reporting
- Custom test templates
- Support for OpenAPI callbacks and webhooks
- CI/CD integration templates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
