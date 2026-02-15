export /**
 * Extracts plain text from React nodes
 */
const extractTextFromReactNode = (node: React.ReactNode): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join('');
  }
  if (node && typeof node === 'object' && 'props' in node) {
    return extractTextFromReactNode((node as { props?: { children?: React.ReactNode } }).props?.children);
  }
  return '';
};

/**
 * Generates a URL-friendly ID from text
 */
export const generateHeadingId = (text: string): string => {
  let cleanText = text.replace(/<[^>]*>/g, '');
  cleanText = cleanText.replace(/[*_`~]/g, '');
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  return cleanText
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff\-\.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};
