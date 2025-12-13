// Database types for Trove Reader

export interface User {
    id: string
    email: string
    created_at: string
}

export interface Profile {
    id: string
    user_id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    current_streak: number
    daily_goal_minutes: number
    total_xp: number
    current_level: number
    created_at: string
    updated_at: string
}

export interface Book {
    id: string
    user_id: string
    title: string
    author: string
    cover_url: string | null
    file_url: string
    format: 'pdf' | 'epub' | 'txt'
    total_pages: number
    created_at: string
    updated_at?: string
}

export interface ReadingProgress {
    id: string
    user_id: string
    book_id: string
    current_page: number
    total_pages: number | null
    progress_percentage: number
    epub_cfi: string | null
    updated_at: string
}

export interface ReadingSession {
    id: string
    user_id: string
    book_id: string
    duration_minutes: number
    session_date: string
    created_at: string
}

export interface Note {
    id: string
    user_id: string
    book_id: string | null
    content: string
    highlight_text: string | null
    page_number: number | null
    color: string
    created_at: string
}

export interface Bookmark {
    id: string
    user_id: string
    book_id: string
    page_number: number | null
    epub_cfi: string | null
    progress_percentage: number | null
    note: string | null
    title: string | null
    created_at: string
}

export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    xp_reward: number
    requirement_type: string
    requirement_value: number
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface UserAchievement {
    id: string
    user_id: string
    achievement_id: string
    unlocked_at: string
    notified: boolean
    achievements?: Achievement
}

export interface Level {
    level: number
    title: string
    min_xp: number
    badge_color: string
}

// Component prop types

export interface BookWithProgress extends Book {
    progress_percentage?: number
    current_page?: number
    progress?: number // Alias for compatibility with BookGrid
}

export interface NoteWithBook extends Note {
    books?: {
        title: string
    }
}

export interface BookmarkWithBook extends Bookmark {
    books: {
        id: string
        title: string
        author: string
        cover_url: string | null
        format: string
    } | null
}

export interface BookQuote {
    id: string
    quote_text: string
    page_number: number | null
    chapter: string | null
    note: string | null
    is_favorite: boolean
    created_at: string
    books: {
        id: string
        title: string
        author: string
        cover_url?: string | null
        format?: string | null
    } | null
}

// API response types

export interface SupabaseError {
    message: string
    details?: string
    hint?: string
    code?: string
}

// Chart data types

export interface ChartDataPoint {
    name: string
    value: number
}

export interface WeeklyReadingData {
    day: string
    minutes: number
}

// Reader types

export interface ReaderTheme {
    background: string
    color: string
    filter?: string
}

export interface LocationData {
    currentPage?: number
    currentCFI?: string
    progressPercentage?: number
}
