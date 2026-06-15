/**
 * Utilities for handling Pixeldrain links
 */

/**
 * Detects if a URL is a Pixeldrain link
 */
export const isPixeldrainUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('pixeldrain.com/u/');
};

/**
 * Transforms a Pixeldrain view URL to a direct file API URL
 * Example: https://pixeldrain.com/u/pNZiDDro -> https://pixeldrain.com/api/file/pNZiDDro
 */
export const transformPixeldrainUrl = (url: string): string => {
  if (!url) return url;
  
  const match = url.match(/pixeldrain\.com\/u\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    // The Pixeldrain API supports proper CORS and Range byte requests.
    // Hence, there's no need to proxy streaming through the backend.
    return `https://pixeldrain.com/api/file/${match[1]}`;
  }
  
  return url;
};
