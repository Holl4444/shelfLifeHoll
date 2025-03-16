import { NextResponse } from 'next/server'; // Send info to server
import { createClient } from '@/app/utils/supabase/server'; // Connect with Supabase - Built in protection against SQL injection and better readability (and writability for JS devs).
import { getRecipeImage } from '@/app/services/spoon-service'; // Fetch images from Spoonacular API

// Set up API endpoint ( /api/ai-image ) request is the incoming recipe from a recipe being generated or viewed (FetchRecipeImage() in app/ai/page.tsx)
export async function POST(request: Request) {
  try {
    const { recipeId, title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Recipe title required' },
        { status: 400 }
      );
    }

    console.log('AI image request received:', { recipeId, title });

    //connect to database
    const supabase = await createClient();
    // Check cache first
    if (recipeId) {
      const { data: existingImage } = await supabase
        .from('recipe_images')
        .select('image_url')
        .eq('recipe_id', recipeId) // equals as in matches a recipe id (WHERE)
        .single(); // just first match

      if (existingImage?.image_url) {
        return NextResponse.json({
          imageUrl: existingImage.image_url,
          source: 'cache',
        });
      }
    }

    // No stored image? => Get image from Spoonacular with helper func
    const imageUrl = await getRecipeImage(title);
    // Cache the result
    if (recipeId) {
      await supabase
        .from('recipe_images')
        .insert({
        recipe_id: recipeId,
        image_url: imageUrl,
        created_at: new Date().toISOString(), // date/time format standardised for machines/applications across time zones etc
      });
    }
    return NextResponse.json({
      imageUrl,
      source: 'spoonacular',
    });
  } catch (error) {
    console.error('Error getting recipe image:', error);

    // If we don't have an image or fail to generate one use backup generic image
    try {
      const defaultPath = '/defaultRecipeImage.jpg';
      const testResponse = await fetch(
        `http://localhost:3000${defaultPath}`, // Request to check if image path works using only headers (lightweight check)
        { method: 'HEAD' }
      );
      if (testResponse.ok) {
        return NextResponse.json({
          imageUrl: defaultPath,
          source: 'fallback',
        });
      } else {
        console.error(
          `Default image not found in API route (status: ${testResponse.status})`
        );
        // Use external link to image
        return NextResponse.json({
          imageUrl:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500',
          source: 'external-fallback',
        });
      }
    } catch (testError) {
      console.error(
        'Error testing default image from API route:',
        testError
      );
      return NextResponse.json({
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500',
        source: 'external-fallback',
      });
    }
  }
}
