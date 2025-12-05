import { ReaderLayout } from "@/components/features/reader/reader-layout"
import { PDFViewer } from "@/components/features/reader/pdf-viewer"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ReaderPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: book } = await supabase
        .from('books')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!book) {
        return <div>Book not found</div>
    }

    // Get signed URL for the file
    const { data } = await supabase.storage
        .from('books')
        .createSignedUrl(book.file_url, 3600) // 1 hour expiry

    return (
        <ReaderLayout title={book.title}>
            <PDFViewer fileUrl={data?.signedUrl || ""} />
        </ReaderLayout>
    )
}
