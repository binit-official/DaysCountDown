import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

// The 'export' keyword was missing here. It has been added.
export const fetchWithRace = async (
    baseUrl: string,
    key1: string,
    key2: string,
    options: RequestInit
) => {
    if (!key2) {
        const url = `${baseUrl}?key=${key1}`;
        return fetchWithRetry(url, options);
    }

    const url1 = `${baseUrl}?key=${key1}`;
    const url2 = `${baseUrl}?key=${key2}`;

    const promise1 = fetchWithRetry(url1, options);
    const promise2 = fetchWithRetry(url2, options);

    return Promise.race([promise1, promise2]);
};