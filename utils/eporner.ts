export const isEpornerUrl = (url: string): boolean => {
  return /^https?:\/\/(www\.)?eporner\.com\/video-([a-zA-Z0-9]+)\//.test(url);
};

export const getEpornerEmbedUrl = (url: string): string | null => {
  const match = url.match(/^https?:\/\/(www\.)?eporner\.com\/video-([a-zA-Z0-9]+)\//);
  if (match && match[2]) {
    return `https://www.eporner.com/embed/${match[2]}/`;
  }
  return null;
};
