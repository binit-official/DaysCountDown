// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetchWithRetry = async (url: string, options: RequestInit & { timeout?: number }, retries = 4, backoff = 3000) => {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const { signal } = controller;
    const timeout = options.timeout || 15000; // Default timeout of 15 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }

      if (response.status === 429) { // Quota exceeded
        if (i < retries - 1) {
          const waitTime = backoff * Math.pow(2, i); // Exponential backoff
          await new Promise(res => setTimeout(res, waitTime));
          continue;
        } else {
          throw new Error('API quota exceeded. Please try again later.');
        }
      } else {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
             if (i < retries - 1) continue; // Retry on timeout
             throw new Error('API request timed out after multiple retries.');
        }
        throw error; // Rethrow other errors
    }
  }
  throw new Error('API request failed after multiple retries.');
};