import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The 'export' keyword is correctly present here now.
export const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 || response.status >= 500) {
        console.warn(`Request failed with status ${response.status}. Retrying...`);
        throw new Error(`Server error: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Failed after multiple retries');
};

// This is the smarter fallback function.
export const fetchWithFallback = async (
    baseUrl: string,
    key1: string,
    key2: string,
    options: RequestInit,
    onStatusUpdate?: (message: string) => void
) => {
    const url1 = `${baseUrl}?key=${key1}`;
    
    const tryFetch = async (url: string) => {
        const response = await fetch(url, options);
        if (response.status === 429) {
            throw new Error(`Rate limit exceeded for this API key.`);
        }
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response;
    };

    try {
        onStatusUpdate?.("Attempting API Key 1...");
        return await tryFetch(url1);
    } catch (error) {
        onStatusUpdate?.(`API Key 1 failed. Attempting fallback...`);
        if (key2) {
            const url2 = `${baseUrl}?key=${key2}`;
            onStatusUpdate?.("Attempting API Key 2...");
            return await tryFetch(url2);
        }
        throw error;
    }
};