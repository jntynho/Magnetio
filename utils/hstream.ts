export const isHstreamUrl = (url: string): boolean => {
  return url.includes('hstream.moe');
};

export const extractHstreamUrl = async (url: string): Promise<any> => {
  try {
    const res = await fetch('/api/hstream/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!res.ok) {
       const text = await res.text();
       try {
           const json = JSON.parse(text);
           throw new Error(json.error || `HTTP ${res.status}: Failed to extract.`);
       } catch (e) {
           throw new Error(`HTTP ${res.status}: ${text || 'Failed to extract.'}`);
       }
    }
    
    const data = await res.json();
    if (data.url) {
      return data;
    }
    throw new Error(data.error || 'Failed to extract hstream url');
  } catch (error: any) {
    console.error('Error fetching hstream stream:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Network Error: Failed to fetch. Please check your internet connection or if an extension is interfering.');
    }
    throw error;
  }
};
