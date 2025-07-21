import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 3000) => {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }

    if (response.status === 429) { // Quota exceeded
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, backoff * (i + 1)));
        continue;
      } else {
        throw new Error('API quota exceeded. Please try again later.');
      }
    } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }
  }
  throw new Error('API request failed after multiple retries.');
};