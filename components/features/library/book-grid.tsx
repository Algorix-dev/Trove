"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { BookOpen, Trash2, Star, MoreVertical, Bookmark, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { type BookWithProgress } from "@/types/database"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { DeleteConfirmDialog } from "@/components/features/delete-confirm-dialog"

// Simple Skeleton if not available
const Skeleton = ({ className }: { className: string }) => (
  <div className={cn("animate-pulse bg-muted rounded-lg", className)} />
)

// Extend the BookWithProgress type to include optional fields
interface ExtendedBook extends Omit<BookWithProgress, 'format'> {
  pages?: number
  rating?: number
  last_read?: string
  format?: BookWithProgress['format'] | string
}

interface BookGridProps {
  books: ExtendedBook[]
  variant?: "grid" | "list"
  showProgress?: boolean
  showActions?: boolean
  isLoading?: boolean
  onDelete?: (bookId: string) => Promise<void>
}

export function BookGrid({
  books,
  variant = "grid",
  showProgress = true,
  showActions = true,
  isLoading = false,
  onDelete
}: BookGridProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null)
  const [_isDeleting, setIsDeleting] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({})

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )

  // Fetch bookmark status for all books
  const fetchBookmarks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('book_id')
        .eq('user_id', user.id)

      if (bookmarks) {
        const bookmarksMap = bookmarks.reduce((acc, item) => ({
          ...acc,
          [item.book_id]: true
        }), {})
        setIsBookmarked(bookmarksMap)
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    }
  }, [supabase])

  useEffect(() => {
    if (books.length > 0) {
      fetchBookmarks()
    }
  }, [books, fetchBookmarks])

  const toggleBookmark = async (bookId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to bookmark books")
        return
      }

      const isCurrentlyBookmarked = isBookmarked[bookId]
      setIsBookmarked(prev => ({
        ...prev,
        [bookId]: !isCurrentlyBookmarked
      }))

      if (isCurrentlyBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('book_id', bookId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('bookmarks')
          .insert([{ book_id: bookId, user_id: user.id }])
      }

      toast.success(isCurrentlyBookmarked ? "Bookmark removed" : "Book saved to your library")
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      setIsBookmarked(prev => ({
        ...prev,
        [bookId]: !prev[bookId]
      }))
      toast.error("Failed to update bookmark")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      setIsDeleting(true)

      if (onDelete) {
        await onDelete(deleteTarget.id)
      } else {
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', deleteTarget.id)

        if (error) throw error
      }

      toast.success("Book deleted successfully")
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting book:', error)
      toast.error("Failed to delete book: " + (error.message || 'Unknown error'))
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500"
    if (progress < 50) return "bg-orange-500"
    if (progress < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const renderBookCard = (book: ExtendedBook) => {
    const isGradient = book.cover_url?.startsWith('gradient:')
    const gradientStyle = isGradient ? book.cover_url?.replace('gradient:', '') : null
    const progress = book.progress_percentage || 0
    const isBookmarkedStatus = isBookmarked[book.id] || false

    return (
      <Card
        key={book.id}
        className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col"
      >
        {showActions && (
          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleBookmark(book.id)
              }}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4 transition-colors",
                  isBookmarkedStatus
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-muted-foreground"
                )}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/reader/${book.id}`} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget({ id: book.id, title: book.title })
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Link href={`/dashboard/reader/${book.id}`} className="block h-full">
          <CardContent className="p-0">
            <div className="aspect-[2/3] relative">
              {isGradient ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-4 text-white"
                  style={{ background: gradientStyle || '' }}
                >
                  <div className="text-center space-y-2 z-10">
                    <BookOpen className="h-10 w-10 mx-auto opacity-90" />
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                      {book.format}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              ) : book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 flex-1 flex flex-col items-start">
            <div className="w-full">
              <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {book.author || 'Unknown Author'}
              </p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {book.format && (
                  <Badge variant="secondary" className="text-xs uppercase">
                    {book.format}
                  </Badge>
                )}
                {book.pages && (
                  <Badge variant="outline" className="text-xs">
                    {book.pages} pages
                  </Badge>
                )}
                {book.rating && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                    {book.rating.toFixed(1)}
                  </Badge>
                )}
              </div>

              {showProgress && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {progress}% complete
                    </span>
                    {book.last_read && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(book.last_read), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full transition-all", getProgressColor(progress))}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardFooter>
        </Link>
      </Card>
    )
  }

  const renderBookListItem = (book: ExtendedBook) => {
    const isGradient = book.cover_url?.startsWith('gradient:')
    const gradientStyle = isGradient ? book.cover_url?.replace('gradient:', '') : null
    const progress = book.progress_percentage || 0
    const isBookmarkedStatus = isBookmarked[book.id] || false

    return (
      <div
        key={book.id}
        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="relative w-20 h-28 flex-shrink-0">
          {isGradient ? (
            <div
              className="w-full h-full rounded flex items-center justify-center"
              style={{ background: gradientStyle || '' }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          ) : book.cover_url ? (
            <img
              src={book.cover_url}
              alt={`Cover of ${book.title}`}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-base line-clamp-1 group-hover:text-primary">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {book.author || 'Unknown Author'}
              </p>
            </div>

            {showActions && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleBookmark(book.id)
                  }}
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isBookmarkedStatus
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    )}
                  />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/reader/${book.id}`} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget({ id: book.id, title: book.title })
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {book.format && (
              <div className="flex items-center gap-1">
                <span className="font-medium uppercase">{book.format}</span>
              </div>
            )}
            {book.pages && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{book.pages} pages</span>
              </div>
            )}
            {book.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span>{book.rating.toFixed(1)}</span>
              </div>
            )}
            {book.last_read && (
              <div className="flex items-center gap-1">
                <span>•</span>
                <span>Last read {formatDistanceToNow(new Date(book.last_read), { addSuffix: true })}</span>
              </div>
            )}
          </div>

          {showProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">
                  {progress}% complete
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round((book.pages || 0) * (progress / 100)) || 0}/{book.pages || '?'} pages
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full transition-all", getProgressColor(progress))}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-6",
        variant === "grid" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1"
      )}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No books found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your search or upload a new book
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      variant === "grid"
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        : "space-y-4"
    )}>
      {variant === "grid"
        ? books.map(book => renderBookCard(book))
        : books.map(book => renderBookListItem(book))
      }

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Book"
          description={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          storageKey={`delete-book-${deleteTarget.id}`}
        />
      )}
    </div>
  )
}
