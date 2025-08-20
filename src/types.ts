import { z } from "zod";

export const WebSearchArgsSchema = z.object({
  query: z.string().describe("The search query to execute on Google"),
  numResults: z
    .number()
    .min(1)
    .max(20)
    .default(5)
    .describe("Number of search results to return (1-20, default: 5)"),
});

export const FetchWebpageArgsSchema = z.object({
  url: z.string().url().describe("The URL of the webpage to fetch"),
});

export type WebSearchArgs = z.infer<typeof WebSearchArgsSchema>;
export type FetchWebpageArgs = z.infer<typeof FetchWebpageArgsSchema>;

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  content?: string;
}
