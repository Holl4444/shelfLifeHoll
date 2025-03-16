import { DISH_TYPES } from '@/app/constants/food-dishes';

//  Optimises a recipe title for image search
//  Prioritises dish types => key ingredients for better results from Spoonacular
export function getImageSearchQuery(title: string): string {
  if (!title) return '';

  // Clean up the title
  const lowerTitle = title.toLowerCase().trim();

  // Words to filter out
  const filterWords = [
    'and',
    'with',
    'the',
    'using',
    'a',
    'of',
    'for',
    'in',
  ];

  // Expanded dish types to check
  const sortedDishTypes = [...DISH_TYPES ].sort((a, b) => a.length - b.length); // Longer names like 'fried rice' come before basics like 'rice'

  // Find dish type in title
  let dishType = '';
  for (const type of sortedDishTypes) {
    if (lowerTitle.includes(type.toLowerCase())) {
      dishType = type.toLowerCase();
      break; //Exits this function only
    }
  }

  // Split and filter words from recipe title
  const words = lowerTitle
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !filterWords.includes(word));

  // If we find a dish type
  if (dishType) {
    // Split dish type into words
    const dishTypeWords = dishType.split(/[\s-]+/);

    // Get ingredients by removing dish type words
    const ingredients = words.filter(
      (word) => !dishTypeWords.includes(word)
    );

    // Take up to 2 key ingredients
    const keyIngredients = ingredients.slice(0, 2);

    // Build query with dish type at the end (better for image search as APIs generally give more weight to last search term)
    return [...keyIngredients, dishType].join(' ');
  }

  // No dish type found - use first 3 significant words
  return words.slice(0, 3).join(' ') || title.toLowerCase();
}

/**
 * Gets a fallback dish type from a recipe title
 * Used when primary image search fails
 */
export function getFallbackDishType(title: string): string | null {
  if (!title) return null;

  const lowerTitle = title.toLowerCase();

  // Common dish types that work well for image search
  const fallbackTypes = [
    'omelette',
    'omelet',
    'fritters',
    'frittata',
    'salad',
    'soup',
    'curry',
    'pasta',
    'stir-fry',
    'stir fry',
    'fried rice',
    'sandwich',
    'pizza',
    'burger',
    'tacos',
    'bowl',
    'chicken breast',
    'chicken',
    'stuffed chicken',
    'stuffed',
    'casserole',
  ];

  // Check if title contains any dish type
  for (const type of fallbackTypes) {
    if (lowerTitle.includes(type)) {
      return type;
    }
  }

  return null;
}
