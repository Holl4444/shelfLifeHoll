import { SpoonacularResponse } from '@/app/types/spoonacular-types';
import {
  getImageSearchQuery,
  getFallbackDishType,
} from '@/app/utils/image-helper';

// Array for queued requests added during throttling (to work around API rate limit)
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

// flag for this session (will update to database tracking when have cloned project)
let quotaExceededInThisSession = false;

async function throttledRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    processQueue(); // Start processing queue if not already
  });
}

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;

  isProcessing = true;
  const request = requestQueue.shift();

  try {
    await request!();
  } catch (error) {
    console.error('Error processing request:', error);
  }

  // Wait between requests to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, 1000));
  isProcessing = false;
  processQueue(); // Process next in queue
}

export async function getRecipeImage(query: string): Promise<string> {
  return throttledRequest(async () => {
    try {
      // Skip API call if we already hit the quota in this session
      if (quotaExceededInThisSession) {
        console.log(
          'Skipping API call - quota exceeded in this session'
        );
        return '/defaultRecipeImage.jpg';
      }

      // Use image search query from helper file
      const searchQuery = getImageSearchQuery(query);
      console.log(
        `Image search query: "${searchQuery}" (from "${query}")`
      );

      // Use URLSearchParams - handle encoding automatically, protect against query injection, auto converts to string, works across all browsers and APIs.
      const params = new URLSearchParams({
        query: searchQuery,
        number: '3',
        sort: 'popularity',
        apiKey: process.env.SPOONACULAR_API_KEY || '',
      });

      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}` //here just for clarity - URLParams will convert to string in template literal.
      );

      // Handle quota exceeded
      if (response.status === 402) {
        console.log('API quota exceeded, using default image');
        quotaExceededInThisSession = true;
        return '/defaultRecipeImage.jpg';
      }

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const data: SpoonacularResponse = await response.json();

      if (!data.results?.length) {
        // Try fallback with dish type
        const fallbackType = getFallbackDishType(query);

        if (fallbackType) {
          console.log(`Trying fallback dish type: ${fallbackType}`);

          const fallbackParams = new URLSearchParams({
            query: fallbackType,
            number: '1',
            apiKey: process.env.SPOONACULAR_API_KEY || '',
          });

          const fallbackResponse = await fetch(
            `https://api.spoonacular.com/recipes/complexSearch?${fallbackParams.toString()}`
          );

          // Check fallback response for quota exceeded
          if (fallbackResponse.status === 402) {
            console.log('API quota exceeded on fallback request');
            quotaExceededInThisSession = true;
            return '/defaultRecipeImage.jpg';
          }

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();

            if (
              fallbackData.results?.length &&
              fallbackData.results[0].image
            ) {
              const imageUrl =
                fallbackData.results[0].image.startsWith('http')
                  ? fallbackData.results[0].image
                  : `https://spoonacular.com/recipeImages/${fallbackData.results[0].image}`;

              console.log(
                `Found fallback image for ${fallbackType}:`,
                imageUrl
              );
              return imageUrl;
            }
          }
        }

        console.log('No results found for:', searchQuery);
        return '/defaultRecipeImage.jpg';
      }

      // Get first result with image
      const result =
        data.results.find((r) => r.image) || data.results[0];

      if (!result?.image) {
        console.log('No images found in results');
        return '/defaultRecipeImage.jpg';
      }

      // Ensure complete URL
      const imageUrl = result.image.startsWith('http')
        ? result.image
        : `https://spoonacular.com/recipeImages/${result.image}`;

      console.log(`Found image for "${query}": ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      console.error('Error fetching recipe image:', error);
      return '/defaultRecipeImage.jpg';
    }
  });
}
