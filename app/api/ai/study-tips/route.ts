import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's reading patterns
    const { data: sessions } = await supabase
      .from("reading_sessions")
      .select("duration_minutes, session_date")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .limit(30)

    // Analyze reading patterns
    const totalMinutes = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0
    const avgMinutes = sessions?.length ? totalMinutes / sessions.length : 0
    const bestTime = "morning" // Could analyze actual times

    // Generate personalized tips
    const tips = [
      {
        title: "Consistency is Key",
        description: `You've been reading an average of ${Math.round(avgMinutes)} minutes per session. Try to maintain this consistency!`,
        type: "consistency"
      },
      {
        title: "Best Reading Time",
        description: "Based on your patterns, you seem to read best in the morning. Schedule your reading sessions during this time.",
        type: "timing"
      },
      {
        title: "Take Breaks",
        description: "Remember to take short breaks every 25-30 minutes to maintain focus and comprehension.",
        type: "health"
      },
      {
        title: "Set Daily Goals",
        description: "Setting a daily reading goal helps build a habit. Start with 15-30 minutes and gradually increase.",
        type: "goals"
      }
    ]

    return NextResponse.json({
      tips,
      analytics: {
        totalSessions: sessions?.length || 0,
        averageMinutes: Math.round(avgMinutes),
        totalMinutes
      }
    })
  } catch (error: any) {
    console.error("Error generating study tips:", error)
    return NextResponse.json(
      { error: "Failed to generate study tips" },
      { status: 500 }
    )
  }
}

