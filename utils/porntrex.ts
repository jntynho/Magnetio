export const isPorntrexUrl = (url: string): boolean => {
  return /^https?:\/\/(www\.)?porntrex\.com\/video\/([0-9]+)\//.test(url);
};

export const getPorntrexEmbedUrl = (url: string): string | null => {
  const match = url.match(/^https?:\/\/(www\.)?porntrex\.com\/video\/([0-9]+)\//);
  if (match && match[2]) {
    return `https://www.porntrex.com/embed/${match[2]}`;
  }
  return null;
};
