"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Loader2, FileText } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

export function UploadModal() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [open, setOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            const fileType = selectedFile.type
            const validTypes = ['application/pdf', 'application/epub+zip']

            // Simple extension check as fallback
            const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()
            const validExts = ['pdf', 'epub']

            if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
                alert("Invalid file type. Please upload a PDF or EPUB file.")
                return
            }

            setFile(selectedFile)
        }
    }

    const handleUpload = async () => {
        if (!file || !user) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // 1. Upload file to Storage
            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get public URL (if bucket is public) or signed URL
            // Assuming 'books' bucket is private, we might need signed URL or just store path
            // For simplicity in this demo, let's assume we store the path and generate signed URL on read
            // Or if bucket is public:
            // const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(filePath)

            // 3. Insert record into database
            const { error: dbError } = await supabase
                .from('books')
                .insert({
                    user_id: user.id,
                    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                    author: "Unknown Author", // Could parse metadata later
                    file_url: filePath,
                    format: fileExt?.toLowerCase() || 'pdf',
                    total_pages: 0
                })

            if (dbError) throw dbError

            setOpen(false)
            setFile(null)
            router.refresh()
            alert("Book uploaded successfully!")
        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Book
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Book</DialogTitle>
                    <DialogDescription>
                        Select a PDF or EPUB file to add to your library.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div
                        className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {file ? (
                            <>
                                <FileText className="h-8 w-8 text-primary mb-4" />
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">Click to select file</p>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.epub"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
