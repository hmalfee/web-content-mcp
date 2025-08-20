# Web Content MCP Server

A powerful **Model Context Protocol (MCP) server** that provides intelligent web search and content extraction capabilities. This server enables AI assistants to search Google and fetch webpage content, automatically converting everything to clean, readable markdown format.

## 🚀 Features

- **Google Search Integration**: Perform Google searches with customizable result counts
- **Content Extraction**: Automatically extracts main content from web pages
- **Markdown Conversion**: Converts HTML content to clean, readable markdown
- **Smart Content Filtering**: Removes ads, navigation, and irrelevant elements
- **Multiple Content Strategies**: Uses intelligent selectors to find the main content
- **Error Handling**: Robust error handling with fallback mechanisms
- **Type Safety**: Built with TypeScript and Zod validation

## 🛠️ Available Tools

### 1. Web Search (`web_search`)

Search Google and return formatted results with extracted content.

**Parameters:**

- `query` (string, required): The search query to execute
- `numResults` (number, optional): Number of results to return (1-20, default: 5)

**Example:**

```json
{
  "name": "web_search",
  "arguments": {
    "query": "TypeScript best practices",
    "numResults": 3
  }
}
```

### 2. Fetch Webpage (`fetch_webpage`)

Fetch and extract content from a specific webpage URL.

**Parameters:**

- `url` (string, required): The URL of the webpage to fetch

**Example:**

```json
{
  "name": "fetch_webpage",
  "arguments": {
    "url": "https://example.com/article"
  }
}
```

## 📋 Prerequisites

- **Node.js** 18+
- **SerpAPI Key** (for Google search functionality)

## 🔧 Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd web-content-mcp
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:

   ```env
   SERPAPI_KEY=your_serpapi_key_here
   ```

   Get your SerpAPI key from [https://serpapi.com/](https://serpapi.com/)

## 🚀 Usage

### Running the Server

Simply run the server using `npx tsx` directly:

```bash
npx tsx --env-file=.env src/index.ts
```

This command:

- Uses `tsx` to run TypeScript directly without compilation
- Loads environment variables from `.env` file
- Starts the MCP server immediately

### As an MCP Server

This server is designed to be used with MCP-compatible clients. Configure your MCP client to connect to this server via stdio transport.

**Example MCP client configuration:**

```json
{
  "mcpServers": {
    "web-content": {
      "command": "npx",
      "args": [
        "tsx",
        "--env-file=/path/to/web-content-mcp/.env",
        "/path/to/web-content-mcp/src/index.ts"
      ],
      "env": {
        "SERPAPI_KEY": "your_api_key"
      }
    }
  }
}
```

## 🏗️ Architecture

The server follows a clean, modular architecture:

```
src/
├── index.ts      # Main server setup and request handling
├── tools.ts      # Tool implementations (WebSearch, FetchWebpage)
├── types.ts      # TypeScript types and Zod schemas
└── env.ts        # Environment variable configuration
```

### Key Components

- **Server**: Main MCP server instance with stdio transport
- **Tools**: Modular tool classes with abstract base class
- **Content Extraction**: Smart HTML-to-markdown conversion
- **Type Safety**: Comprehensive Zod validation schemas
- **Error Handling**: Graceful error handling with informative messages

## 🔍 Content Extraction Strategy

The server uses an intelligent content extraction approach:

1. **Content Selectors**: Tries multiple selectors to find main content:

   - `main`, `article`, `.content`, `.main-content`
   - `.post-content`, `.entry-content`, `#content`
   - `.container` (as fallback)

2. **Content Cleaning**: Removes unwanted elements:

   - Scripts, styles, navigation
   - Headers, footers, sidebars
   - Advertisements and promotional content

3. **Markdown Conversion**:
   - Converts HTML to clean markdown
   - Preserves images with alt text
   - Maintains proper heading structure
   - Limits content length to prevent overflow

## ⚙️ Configuration

The server includes several configurable options in `tools.ts`:

```typescript
const config = {
  serpApiKey: env.SERPAPI_KEY,
  timeout: 10000, // Request timeout (ms)
  maxContentLength: 5000, // Max content length per page
  userAgent: "Mozilla/5.0 (compatible; WebContentMCP/1.0)",
};
```

## 🔒 Environment Variables

| Variable      | Description                        | Required |
| ------------- | ---------------------------------- | -------- |
| `SERPAPI_KEY` | Your SerpAPI key for Google search | Yes      |

## 📄 Output Format

Both tools return content in markdown format:

### Web Search Results

```markdown
# Web Search Results for: "query"

Found X results:

## 1. Page Title

**URL:** https://example.com
**Snippet:** Brief description...
**Content:**
Main page content in markdown...

---
```

### Webpage Content

```markdown
# Webpage Content

**URL:** https://example.com
**Content:**
Extracted page content in markdown...
```

## 🛡️ Error Handling

The server includes comprehensive error handling:

- **Network errors**: Timeout and connection failures
- **API errors**: SerpAPI rate limits and authentication
- **Content errors**: Invalid URLs and parsing failures
- **Validation errors**: Invalid input parameters

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com//web-content-mcp/issues) page
2. Create a new issue with detailed information
3. Include error messages and environment details

---

**Built with ❤️ using TypeScript and the Model Context Protocol**
