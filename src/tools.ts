import axios from "axios";
import TurndownService from "turndown";
import * as cheerio from "cheerio";
import { SearchResult, WebSearchArgs, FetchWebpageArgs } from "./types.js";
import { env } from "./env.js";

abstract class Tool {
  abstract execute(args: any): Promise<string>;
  static getToolDescription(): any {
    throw new Error("getToolDescription must be implemented by subclasses");
  }
}

const config = {
  serpApiKey: env.SERPAPI_KEY,
  timeout: 10000,
  maxContentLength: 5000,
  userAgent: "Mozilla/5.0 (compatible; WebContentMCP/1.0)",
};

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

turndown.addRule("preserveImages", {
  filter: "img",
  replacement: (content, node) => {
    const element = node as any;
    return `![${element.alt || ""}](${element.src || ""})`;
  },
});

abstract class BaseWebTool extends Tool {
  protected async fetchContent(url: string): Promise<string> {
    const response = await axios.get(url, {
      timeout: config.timeout,
      headers: { "User-Agent": config.userAgent },
    });

    const $ = cheerio.load(response.data);
    $(
      "script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar"
    ).remove();

    const selectors = [
      "main",
      "article",
      ".content",
      ".main-content",
      ".post-content",
      ".entry-content",
      "#content",
      ".container",
    ];
    let content = "";

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0 && element.text().trim().length > 100) {
        content = element.html() || "";
        break;
      }
    }

    if (!content) content = $("body").html() || "";

    return turndown
      .turndown(content)
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/^\s+|\s+$/g, "")
      .substring(0, config.maxContentLength);
  }
}

export class WebSearch extends BaseWebTool {
  static getToolDescription() {
    return {
      name: "web_search",
      description:
        "Search Google and return formatted results as readable markdown. Fetches actual content from the top results and converts it to markdown format.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string" as const,
            description: "The search query to execute on Google",
          },
          numResults: {
            type: "number" as const,
            description:
              "Number of search results to return (1-20, default: 5)",
            minimum: 1,
            maximum: 20,
            default: 5,
          },
        },
        required: ["query"],
      },
    };
  }

  private async googleSearch(
    query: string,
    numResults: number
  ): Promise<SearchResult[]> {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google",
        q: query,
        num: numResults,
        api_key: config.serpApiKey,
      },
    });

    if (response.data.error)
      throw new Error(`SerpAPI error: ${response.data.error}`);

    return (response.data.organic_results || []).map((result: any) => ({
      title: result.title || "No title",
      link: result.link || "",
      snippet: result.snippet || "No snippet available",
    }));
  }

  private async enrichResults(
    results: SearchResult[]
  ): Promise<SearchResult[]> {
    const enriched: SearchResult[] = [];
    for (const result of results) {
      try {
        const content = await this.fetchContent(result.link);
        enriched.push({ ...result, content });
      } catch {
        enriched.push({ ...result, content: result.snippet });
      }
    }
    return enriched;
  }

  private formatResults(results: SearchResult[], query: string): string {
    let md = `# Web Search Results for: "${query}"\n\nFound ${results.length} results:\n\n`;

    results.forEach((result, i) => {
      md += `## ${i + 1}. ${result.title}\n\n**URL:** ${
        result.link
      }\n\n**Snippet:** ${result.snippet}\n\n`;
      if (result.content && result.content !== result.snippet) {
        md += `**Content:**\n\n${result.content}\n\n`;
      }
      md += "---\n\n";
    });

    return md;
  }

  private async search(args: WebSearchArgs): Promise<string> {
    try {
      const results = await this.googleSearch(args.query, args.numResults);
      const enriched = await this.enrichResults(results);
      return this.formatResults(enriched, args.query);
    } catch (error) {
      throw new Error(
        `Web search failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async execute(args: WebSearchArgs): Promise<string> {
    return this.search(args);
  }
}

export class FetchWebpage extends BaseWebTool {
  static getToolDescription() {
    return {
      name: "fetch_webpage",
      description:
        "Fetch and return the content of a specific webpage as formatted markdown. Directly accesses the given URL without searching.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: {
            type: "string" as const,
            description: "The URL of the webpage to fetch",
            format: "uri",
          },
        },
        required: ["url"],
      },
    };
  }

  private formatPage(url: string, content: string): string {
    return `# Webpage Content\n\n**URL:** ${url}\n\n**Content:**\n\n${content}\n\n`;
  }

  private async fetch(args: FetchWebpageArgs): Promise<string> {
    try {
      const content = await this.fetchContent(args.url);
      return this.formatPage(args.url, content);
    } catch (error) {
      throw new Error(
        `Page fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async execute(args: FetchWebpageArgs): Promise<string> {
    return this.fetch(args);
  }
}
