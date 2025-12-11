import { ReaderLayout } from "@/components/features/reader/reader-layout"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { BookOpen } from "lucide-react"
import dynamic from "next/dynamic"

const PDFViewer = dynamic(
    () => import("@/components/features/reader/pdf-viewer").then(mod => mod.PDFViewer),
    { ssr: false }
)
const EpubViewer = dynamic(
    () => import("@/components/features/reader/epub-viewer").then(mod => mod.EpubViewer),
    { ssr: false }
)
const TxtViewer = dynamic(
    () => import("@/components/features/reader/txt-viewer").then(mod => mod.TxtViewer),
    { ssr: false }
)

export default async function ReaderPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const search = await searchParams
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: book } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

    if (!book) {
        return (
            <div className="flex h-screen items-center justify-center">
                <EmptyState
                    icon={BookOpen}
                    title="Book not found"
                    description="The book you're looking for doesn't exist or you don't have access to it."
                    actionLabel="Return to Library"
                    actionHref="/dashboard"
                />
            </div>
        )
    }

    // Extract file path from public URL to create a signed URL
    // Public URL format: .../storage/v1/object/public/books/[path]
    const filePath = book.file_url.split('/books/').pop()
    const decodedPath = filePath ? decodeURIComponent(filePath) : ""

    // Get signed URL for the file (works for both private and public buckets)
    const { data } = await supabase.storage
        .from('books')
        .createSignedUrl(decodedPath, 3600) // 1 hour expiry

    const fileUrl = data?.signedUrl || book.file_url // Fallback to public URL if signing fails
    const format = book.format || 'pdf'

    // Extract bookmark navigation params
    const bookmarkPage = search.page ? parseInt(search.page as string) : undefined
    const bookmarkCFI = search.cfi as string | undefined
    const bookmarkProgress = search.progress ? parseFloat(search.progress as string) : undefined

    return (
        <ReaderLayout title={book.title} bookId={id} userId={user.id}>
            {format === 'epub' ? (
                <EpubViewer
                    url={fileUrl}
                    userId={user.id}
                    bookId={id}
                    initialLocation={bookmarkCFI}
                />
            ) : format === 'txt' ? (
                <TxtViewer
                    url={fileUrl}
                    userId={user.id}
                    bookId={id}
                    initialLocation={bookmarkProgress}
                />
            ) : (
                <PDFViewer
                    fileUrl={fileUrl}
                    bookId={id}
                    userId={user.id}
                    initialPage={bookmarkPage}
                />
            )}
        </ReaderLayout>
    )
}
