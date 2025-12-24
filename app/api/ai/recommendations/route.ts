import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's reading history and preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("favorite_genres, favorite_books, favorite_authors")
      .eq("user_id", user.id)
      .single()

    const { data: readingHistory } = await supabase
      .from("reading_progress")
      .select("book_id, progress_percentage, books(title, author)")
      .eq("user_id", user.id)
      .gt("progress_percentage", 50)

    // Get user's completed books
    const { data: completedBooks } = await supabase
      .from("reading_progress")
      .select("book_id, books(title, author)")
      .eq("user_id", user.id)
      .eq("progress_percentage", 100)

    // Simple recommendation logic (can be enhanced with AI)
    const genres = preferences?.favorite_genres || []
    const recommendations: any[] = []

    // For now, return a structured response
    // In production, you'd call OpenAI API here
    return NextResponse.json({
      recommendations: recommendations,
      basedOn: {
        genres: genres,
        completedBooks: completedBooks?.length || 0,
        readingHistory: readingHistory?.length || 0
      }
    })
  } catch (error: any) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}

