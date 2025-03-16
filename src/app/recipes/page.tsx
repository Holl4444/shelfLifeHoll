'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import styles from './recipes.module.css';
import { MobileLayout } from '../components/mobile-layout';
import { FoodItemType } from '../types/food-item';
import { foodItems as initialFoodItems } from '../data/food-items';
import { FoodItem } from '../components/food-item';

// First, update your DbRecipe interface to match the actual database schema:
interface DbRecipe {
  id: number;
  name: string;
  cuisine: string;
  ingredients_lowercase: string;
  imageUrl?: string;
  // Add other fields that are actually in your database
  // Leave out fields that don't exist in the database
}

// Define the Recipe type
interface Recipe {
  id: number;
  name: string;
  cuisine: string;
  imageUrl?: string;
  match_count?: number;

  // Make all these fields optional with ? since they might not be in your DB records
  dietaryInfoType?: string;
  dietaryInfoRestrictions?: string;
  dietaryInfoSuitableFor?: string;
  dietaryInfoAllergens?: string;
  dietaryInfoVeganSubstitutions?: string | null;
  dietaryInfoGlutenFreeOption?: string | null;
  dietaryInfoProteinSource?: string | null;
  dietaryInfoNutrientDense?: string | null;
  dietaryInfoTraditionalDish?: string | null;
  ingredients?: string[];
  steps?: string[];
  cookingUtensils?: string[];
  nutritionalInfoServings?: number;
  nutritionalInfoCaloriesPerServing?: number;
  nutritionalInfoProteinPerServing?: number;
  nutritionalInfoCarbsPerServing?: number;
  nutritionalInfoFatPerServing?: number;
  nutritionalInfoFiber?: number;
  nutritionalInfoCholesterol?: number | null;
  prepTime?: string;
  cookTime?: string;
  ingredientsLowercase?: string[];
}

// Initialize Supabase client (replace with your actual Supabase URL and key)
// Import your configured client


// In your component:
const supabase = createClient();

export default function RecipesPage() {
  const [topMatches, setTopMatches] = useState<Recipe[]>([]);
  const [otherMatches, setOtherMatches] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodItems, setFoodItems] = useState<FoodItemType[]>([]); // Function to fetch food items
  const carouselRef = useRef<HTMLDivElement>(null);

  const refreshItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supabaseRoute');
      console.log(JSON.stringify(response, null, 2));
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(
          `Failed to fetch data: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      console.log(`Received ${data.length} items from API`);
      setFoodItems(data);
    } catch (error) {
      console.error('Error fetching food items:', error);
      setFoodItems(initialFoodItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshItems();
  }, []);

  function cleanIngredientsData(
    ingredients: FoodItemType[]
  ): { name: string; expiry_date: string }[] {
    return ingredients.map((ingredient) => ({
      name: ingredient.name.toLowerCase(),
      expiry_date: ingredient.expiry_date.split(' ')[0], // or .slice(0, 10)
    }));
  }

  useEffect(() => {
    if (foodItems.length === 0) return; // Don't run if no food items
    const clean_dummy = cleanIngredientsData(foodItems);

    async function fetchRecipes() {
      try {
        const { data: allRecipes, error } = await supabase
          .from('recipes')
          .select('*');

        if (error) throw error;

        // Cast to DbRecipe[] first
        const dbRecipes = allRecipes as DbRecipe[];

        // Process and cast to Recipe[]
        const processedRecipes: Recipe[] = dbRecipes.map((recipe) => {
          let matchCount = 0;

          try {
            // Your existing match count logic
            if (
              recipe.ingredients_lowercase &&
              typeof recipe.ingredients_lowercase === 'string'
            ) {
              const ingredientsArray = recipe.ingredients_lowercase
                .split(',')
                .map((ing: string) => ing.trim());
              const cleanedIngredientNames = clean_dummy.map(
                (item) => item.name
              );
              matchCount = cleanedIngredientNames.filter(
                (cleanName) =>
                  ingredientsArray.some((recipeIng: string) =>
                    recipeIng.includes(cleanName)
                  )
              ).length;
            } else {
              console.warn(
                `Recipe ${recipe.id} has invalid ingredients_lowercase:`,
                recipe.ingredients_lowercase
              );
            }
          } catch (e) {
            console.error(`Error processing recipe ${recipe.id}:`, e);
          }

          // Return properly typed Recipe object
          return {
            id: recipe.id,
            name: recipe.name,
            cuisine: recipe.cuisine,
            imageUrl: recipe.imageUrl || undefined,
            match_count: matchCount,
            // Any other fields that are in your DB records
          };
        });

        const topData = processedRecipes
          .filter((recipe) => (recipe.match_count ?? 0) > 0) // Handle undefined with nullish coalescing
          .sort((a, b) => (b.match_count ?? 0) - (a.match_count ?? 0)) // Handle undefined when sorting
          .slice(0, 4);

        // Similarly for otherData:
        const { data: otherData, error: otherError } = await supabase
          .from('recipes')
          .select('*')
          .range(4, 12);

        if (otherError) throw otherError;

        // Process and cast otherData too
        const processedOtherData: Recipe[] = (
          otherData as DbRecipe[]
        ).map((recipe) => {
          // Similar processing as above if needed
          return {
            id: recipe.id,
            name: recipe.name,
            cuisine: recipe.cuisine,
            imageUrl: recipe.imageUrl || undefined,
            match_count: 0, // Default match count for other recipes
            // Any other fields that are in your DB records
          };
        });

        setTopMatches(topData || []);
        setOtherMatches(processedOtherData || []);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
  }, [foodItems]);

  // Scroll functions for the carousel
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -200,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <MobileLayout>
      <div className={styles.container}>
        {/* Top Matches Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Top Matches:</h2>
          {loading ? (
            <p>Loading top matches...</p>
          ) : topMatches.length > 0 ? (
            <div className={styles.cardsContainer}>
              {topMatches.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  cardColor="orange"
                />
              ))}
            </div>
          ) : (
            <p className={styles.noMatches}>No matching recipes...</p>
          )}
        </section>

        {/* Other Matches Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>More Recipes:</h2>
          {loading ? (
            <p>Loading suggestions...</p>
          ) : otherMatches.length > 0 ? (
            <div className={styles.carouselContainer}>
              <button
                className={`${styles.carouselButton} ${styles.leftButton}`}
                onClick={scrollLeft}
                aria-label="Scroll left"
              >
                &lt;
              </button>
              <div className={styles.carousel} ref={carouselRef}>
                {otherMatches.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    cardColor="teal"
                  />
                ))}
              </div>
              <button
                className={`${styles.carouselButton} ${styles.rightButton}`}
                onClick={scrollRight}
                aria-label="Scroll right"
              >
                &gt;
              </button>
            </div>
          ) : (
            <p className={styles.noMatches}>
              No additional suggestions...
            </p>
          )}
        </section>

        {/* Bottom Action Buttons */}
        <section className={styles.actionsSection}>
          <Link
            href="/fullrecipelist"
            className={styles.actionButton}
          >
            <div className={styles.fullDatabaseBtn}>
              Full Recipe Database
            </div>
          </Link>

          <Link href="/ai" className={styles.actionButton}>
            <div className={styles.aiSuggestionBtn}>
              AI Suggestion
            </div>
          </Link>
        </section>
      </div>
    </MobileLayout>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  cardColor: 'orange' | 'teal';
}

// Fix the RecipeCard component syntax:

function RecipeCard({ recipe, cardColor }: RecipeCardProps) {
  const cardClass =
    cardColor === 'orange' ? styles.orangeCard : styles.tealCard;

  // Truncate title if longer than 25 characters
  const truncateTitle = (title: string, maxLength: number = 25) => {
    return title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;
  };

  return (
    <div className={`${styles.recipeCard} ${cardClass}`}>
      <div className={styles.recipeImageContainer}>
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className={styles.recipeImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <div className={styles.mountainIcon}></div>
            <div className={styles.sunIcon}></div>
          </div>
        )}
      </div>
      <div className={styles.recipeInfo}>
        <h3 className={styles.recipeTitle}>
          {truncateTitle(recipe.name)}
        </h3>
        <p className={styles.recipeMatches}>
          Ingredients used: <span>{recipe.match_count ?? 0}</span>
        </p>
      </div>
    </div>
  );
}
