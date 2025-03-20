'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../utils/supabase/server';

// Define a return type for the login function
type LoginResult = { error: string } | undefined;

export async function login(
  formData: FormData
): Promise<LoginResult> {
  console.log('🔐 Server Action: login() called'); 

  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  console.log(`📧 Attempting login for email: ${data.email}`); 

  const { error } = await supabase.auth.signInWithPassword(data);

  // Improved error logging
  if (error) {
    console.log(`❌ Login failed: ${error.message}`); 
    return { error: error.message };
  }

  console.log('✅ Login successful, redirecting to dashboard'); 

  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard'); // Redirect to dashboard instead of homepage

  // TypeScript requires a return even though redirect prevents this from being reached
  return undefined;
}

export async function signup(
  formData: FormData
): Promise<LoginResult> {
  console.log('📝 Server Action: signup() called'); // Add this log

  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  console.log(`📧 Attempting signup for email: ${data.email}`); 

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.log(`❌ Signup failed: ${error.message}`); 
    redirect('/error');
  }

  console.log('✅ Signup successful, redirecting to homepage'); 

  revalidatePath('/', 'layout');
  redirect('/');
}
