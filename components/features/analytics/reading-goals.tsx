"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Target, Trophy, TrendingUp, Edit2, Check } from "lucide-react"
import { toast } from "sonner"

interface ReadingGoal {
    id: string
    year: number
    target_books: number
    books_completed: number
}

export function ReadingGoals() {
    const { user } = useAuth()
    const [goal, setGoal] = useState<ReadingGoal | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [newTarget, setNewTarget] = useState(12)

    const currentYear = new Date().getFullYear()

    useEffect(() => {
        if (!user) return
        fetchGoal()
    }, [user])

    const fetchGoal = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        const supabase = createBrowserSupabaseClient()
        try {
            // Fetch completed books count dynamically
            const { count: completedCount } = await supabase
                .from('reading_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('progress_percentage', 100)

            // Fetch goal settings
            const { data } = await supabase
                .from('reading_goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('year', currentYear)
                .maybeSingle()

            if (data) {
                setGoal({
                    ...data,
                    books_completed: completedCount || 0
                })
                setNewTarget(data.target_books)
            } else {
                // Create default goal
                const { data: newGoal } = await supabase
                    .from('reading_goals')
                    .insert({
                        user_id: user.id,
                        year: currentYear,
                        target_books: 12
                    })
                    .select()
                    .single()

                if (newGoal) {
                    setGoal({
                        ...newGoal,
                        books_completed: completedCount || 0
                    })
                }
            }
        } finally {
            setLoading(false)
        }
    }

    const updateGoal = async () => {
        if (!user || !goal) return

        const supabase = createBrowserSupabaseClient()

        const { error } = await supabase
            .from('reading_goals')
            .update({ target_books: newTarget })
            .eq('id', goal.id)

        if (error) {
            toast.error("Failed to update goal")
        } else {
            setGoal({ ...goal, target_books: newTarget })
            setEditing(false)
            toast.success("Goal updated!")
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {currentYear} Reading Goal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-32 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>
        )
    }

    if (!goal) return null

    const progress = (goal.books_completed / goal.target_books) * 100
    const remaining = Math.max(0, goal.target_books - goal.books_completed)
    const isComplete = goal.books_completed >= goal.target_books

    return (
        <Card className={isComplete ? "border-green-500" : ""}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {currentYear} Reading Goal
                    </span>
                    {!editing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(true)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress Display */}
                <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                        {goal.books_completed}
                        <span className="text-2xl text-muted-foreground">/{goal.target_books}</span>
                    </div>
                    <p className="text-muted-foreground">
                        {isComplete ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Goal achieved! 🎉
                            </span>
                        ) : (
                            `${remaining} ${remaining === 1 ? 'book' : 'books'} to go`
                        )}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <Progress value={Math.min(progress, 100)} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{Math.round(progress)}% complete</span>
                        {!isComplete && (
                            <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {(goal.target_books / 12).toFixed(1)}/month
                            </span>
                        )}
                    </div>
                </div>

                {/* Edit Goal */}
                {editing && (
                    <div className="flex gap-2 items-center p-4 bg-muted rounded-lg">
                        <label className="text-sm font-medium whitespace-nowrap">
                            Target books:
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={365}
                            value={newTarget}
                            onChange={(e) => setNewTarget(parseInt(e.target.value))}
                            className="max-w-24"
                        />
                        <Button
                            size="sm"
                            onClick={updateGoal}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setEditing(false)
                                setNewTarget(goal.target_books)
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Motivation */}
                {!isComplete && (
                    <div className="text-center text-sm text-muted-foreground italic">
                        "The more that you read, the more things you will know." — Dr. Seuss
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
