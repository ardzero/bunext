'use server'
// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSampleItem(formData: FormData) {
  try {
    const rawFormData = {
      title: formData.get('title'),
      description: formData.get('description'),
    }

    // Sample validation
    if (!rawFormData.title || !rawFormData.description) {
      throw new Error('Title and description are required')
    }

    // Here you would typically:
    // 1. Validate the data
    // 2. Insert into database
    // 3. Handle any errors

    // Sample success path
    revalidatePath('/items') // Revalidate the items list
    redirect('/items') // Redirect to items page
  } catch (error) {
    // Handle errors appropriately
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'Something went wrong',
    }
  }
}
