export const MAX_MARKDOWN_CACHE_SIZE = 50;

export type MarkdownCacheEntry<Toc = unknown> = {
  content: string;
  toc: Toc;
  lastModified: string;
};

const contentCache = new Map<string, MarkdownCacheEntry<unknown>>();

export const getMarkdownCacheEntry = <Toc = unknown>(
  key: string
): MarkdownCacheEntry<Toc> | undefined => {
  return contentCache.get(key) as MarkdownCacheEntry<Toc> | undefined;
};

export const setMarkdownCacheEntry = <Toc = unknown>(
  key: string,
  value: MarkdownCacheEntry<Toc>,
  maxSize: number = MAX_MARKDOWN_CACHE_SIZE
): void => {
  contentCache.delete(key);
  contentCache.set(key, value as MarkdownCacheEntry<unknown>);

  if (contentCache.size > maxSize) {
    const firstKey = contentCache.keys().next().value;
    if (firstKey) {
      contentCache.delete(firstKey);
    }
  }
};
