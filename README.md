# OpenAPI Test Platform

An AI-powered API testing platform that generates and executes comprehensive test suites from OpenAPI specifications. Tests are stored as structured data (Bruno-like format) and can be executed directly in the browser or exported as code.

## Features

### Core Platform Features
- **AI-Powered Test Generation**: Uses Claude AI (via Vercel AI SDK) to analyze OpenAPI specs and generate intelligent test cases
- **In-Browser Test Execution**: Run HTTP tests directly in the interface with real-time results
- **Structured Test Format**: Tests stored as JSON (similar to Bruno/Postman collections), ready for database storage
- **Comprehensive Assertions**: Validate status codes, headers, JSON responses, response times, and schemas
- **Dual Output**: Get both executable test collections AND exportable Vitest code files
- **Multiple Input Methods**: Upload OpenAPI spec via file or URL

### Test Runner Capabilities
- Execute individual tests or entire collections
- Real-time result visualization with detailed pass/fail feedback
- HTTP request/response inspection
- Assertion-level result breakdown
- Collection execution summary (passed/failed/errors/duration)
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)

### Assertion Types Supported
- **Status Code**: Validate HTTP response status
- **Headers**: Check presence and values of response headers
- **JSON Path**: Query and validate specific fields in JSON responses ($.path.to.field)
- **Body**: Full response body matching
- **Response Time**: Performance assertions
- **Schema**: JSON schema validation

### Assertion Operators
- `equals`, `notEquals`
- `contains`, `notContains`
- `greaterThan`, `lessThan`
- `exists`, `notExists`
- `matches` (regex)

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

Example URL to try: `https://petstore3.swagger.io/api/v3/openapi.json`

### 2. Generate Test Suite

Click "Generate Tests" and wait while the AI analyzes your API and generates:
- Structured test collection (JSON format)
- Vitest code files (for export)

### 3. Run Tests in Browser

Switch to the **Test Runner** tab to:
- View all generated tests organized by endpoint
- Run individual tests with one click
- Execute the entire collection
- See real-time pass/fail results
- Inspect detailed assertion results
- View request/response data

### 4. Export Code (Optional)

Switch to the **Generated Code** tab to:
- Preview Vitest test files with syntax highlighting
- Copy individual tests to clipboard
- Download test files individually or as ZIP
- Use in your CI/CD pipeline

## Test Format Example

Tests are stored in a structured JSON format:

```json
{
  "id": "test-uuid",
  "name": "should create user with valid data",
  "description": "Validates successful user creation",
  "request": {
    "method": "POST",
    "url": "https://api.example.com/users",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "type": "json",
      "data": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  },
  "assertions": [
    {
      "type": "status",
      "operator": "equals",
      "value": 201,
      "description": "Response status should be 201"
    },
    {
      "type": "jsonPath",
      "field": "$.data.id",
      "operator": "exists",
      "description": "Response should contain user ID"
    }
  ],
  "testType": "success"
}
```

## Project Structure

```
/
├── app/
│   ├── page.tsx                      # Homepage with upload form
│   ├── results/page.tsx              # Test runner & code viewer
│   ├── api/
│   │   ├── parse-openapi/            # OpenAPI parser endpoint
│   │   ├── generate-tests/           # AI test generation endpoint
│   │   ├── execute-test/             # Single test execution
│   │   └── execute-collection/       # Batch test execution
├── components/
│   ├── OpenAPIUploader.tsx           # File/URL input component
│   ├── TestCollectionView.tsx        # Collection runner UI
│   ├── TestItem.tsx                  # Individual test component
│   ├── TestExecutionResult.tsx       # Result visualization
│   ├── TestPreview.tsx               # Code preview with highlighting
│   └── DownloadButton.tsx            # ZIP download functionality
├── lib/
│   ├── openapi-parser.ts             # OpenAPI spec parser
│   ├── ai-test-generator.ts          # AI-powered test generation
│   ├── collection-generator.ts       # Test collection builder
│   ├── test-runner.ts                # HTTP test execution engine
│   ├── test-generator.ts             # Legacy code generator
│   └── templates/
│       └── vitest-template.ts        # Vitest code templates
└── types/
    ├── index.ts                      # Core type definitions
    └── test-format.ts                # Structured test format types
```

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React with Tailwind CSS
- **AI**: Vercel AI SDK with Anthropic Claude
- **OpenAPI Parsing**: @apidevtools/swagger-parser
- **HTTP Client**: Axios
- **Test Execution**: Custom test runner with assertion engine
- **Code Highlighting**: react-syntax-highlighter

## How It Works

### Test Generation Flow

1. **Parse**: OpenAPI specification is validated and parsed
2. **Analyze**: Claude AI analyzes each endpoint to understand:
   - Required vs optional parameters
   - Valid data types and constraints
   - Expected responses and error cases
   - Potential edge cases
3. **Generate**: AI generates structured test cases covering:
   - Happy path scenarios (2xx responses)
   - Validation errors (missing fields, wrong types)
   - Edge cases (boundary values, special characters)
   - Error handling (4xx, 5xx responses)
4. **Store**: Tests saved as JSON objects (database-ready format)
5. **Execute**: Tests can be run immediately or exported as code

### Test Execution Flow

1. **Prepare**: Test runner builds HTTP request from test data
2. **Execute**: HTTP request sent to target API
3. **Validate**: Each assertion evaluated against response:
   - Status code validation
   - Header checks
   - JSON path queries
   - Body matching
   - Performance metrics
4. **Report**: Detailed results with pass/fail per assertion

## Use Cases

1. **API Development**: Generate test suites during API development
2. **API Documentation**: Test your OpenAPI specs are accurate
3. **CI/CD Integration**: Export tests as Vitest files for pipelines
4. **API Monitoring**: Run tests to monitor API health
5. **Contract Testing**: Validate API contracts match specifications
6. **Regression Testing**: Ensure API changes don't break existing functionality

## Known Limitations

- Supports OpenAPI 3.x only (not 2.0/Swagger)
- No built-in authentication configuration (add manually if needed)
- Tests execute from browser (CORS may apply for some APIs)
- No test execution history/persistence (coming soon)
- No mock server support (tests hit real endpoints)

## Future Enhancements

- **Database Integration**: Persist test collections with Vercel Postgres
- **Authentication**: Built-in auth strategy configuration (API keys, OAuth, JWT)
- **Test History**: Track execution history and trends
- **Scheduling**: Run tests on schedule
- **Webhooks**: Trigger tests via webhooks
- **Multiple Frameworks**: Support Jest, Mocha, Pytest code generation
- **Mock Mode**: Execute tests against mock servers
- **Environments**: Manage multiple API environments
- **Team Collaboration**: Share test collections
- **CI/CD Templates**: Pre-built GitHub Actions, GitLab CI configs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
