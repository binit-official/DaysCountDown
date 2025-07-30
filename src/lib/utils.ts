import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function remains the same, it's used by our new fallback function.
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


// This is the new, more efficient fallback function that replaces the race logic.
export const fetchWithFallback = async (
    baseUrl: string,
    key1: string,
    key2: string,
    options: RequestInit
) => {
    const url1 = `${baseUrl}?key=${key1}`;
    
    try {
        // First, try the primary key
        console.log("Attempting API call with primary key...");
        return await fetchWithRetry(url1, options);
    } catch (error) {
        console.warn(`Primary API key failed: ${error}. Attempting fallback...`);
        
        // If the first key fails and a second key exists, try the fallback key
        if (key2) {
            const url2 = `${baseUrl}?key=${key2}`;
            console.log("Attempting API call with fallback key...");
            return await fetchWithRetry(url2, options);
        }
        
        // If there's no second key or the second one also fails, throw the error
        throw error;
    }
};