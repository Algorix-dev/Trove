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
import { Input } from "@/components/ui/input"
import { Upload, Loader2, FileText, Image as ImageIcon } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

// Generate a beautiful gradient based on book title
function generateGradient(title: string): string {
    const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
        "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    ]
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
}

export function UploadModal() {
    const [file, setFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [open, setOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
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

            const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()
            const validExts = ['pdf', 'epub']

            if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
                alert("Invalid file type. Please upload a PDF or EPUB file.")
                return
            }

            setFile(selectedFile)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            const fileType = droppedFile.type
            const validTypes = ['application/pdf', 'application/epub+zip']
            const fileExt = droppedFile.name.split('.').pop()?.toLowerCase()
            const validExts = ['pdf', 'epub']

            if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
                alert("Invalid file type. Please upload a PDF or EPUB file.")
                return
            }

            setFile(droppedFile)
        }
    }

    const handleUpload = async () => {
        if (!file || !user) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // 1. Upload book file to Storage
            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            let coverUrl = null

            // 2. Upload cover image if provided
            if (coverFile) {
                const coverExt = coverFile.name.split('.').pop()
                const coverFileName = `${Math.random()}.${coverExt}`
                const coverPath = `${user.id}/covers/${coverFileName}`

                const { error: coverError } = await supabase.storage
                    .from('books')
                    .upload(coverPath, coverFile)

                if (!coverError) {
                    const { data } = supabase.storage.from('books').getPublicUrl(coverPath)
                    coverUrl = data.publicUrl
                }
            }

            // 3. If no cover uploaded, generate gradient data
            const bookTitle = file.name.replace(/\.[^/.]+$/, "")
            if (!coverUrl) {
                coverUrl = `gradient:${generateGradient(bookTitle)}`
            }

            // 4. Insert record into database
            const { error: dbError } = await supabase
                .from('books')
                .insert({
                    user_id: user.id,
                    title: bookTitle,
                    author: "Unknown Author",
                    file_url: filePath,
                    cover_url: coverUrl,
                    format: fileExt?.toLowerCase() || 'pdf',
                    total_pages: 0
                })

            if (dbError) throw dbError

            setOpen(false)
            setFile(null)
            setCoverFile(null)
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Book</DialogTitle>
                    <DialogDescription>
                        Select a PDF or EPUB file to add to your library. Optionally add a cover image.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Book File Upload */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <>
                                <FileText className="h-8 w-8 text-primary mb-2" />
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Click or drag to upload book</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF or EPUB files only</p>
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

                    {/* Cover Image Upload (Optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cover Image (Optional)</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                ref={coverInputRef}
                                accept="image/*"
                                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                className="flex-1"
                            />
                            {coverFile && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ImageIcon className="h-3 w-3" />
                                    {coverFile.name}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            If not provided, a beautiful gradient will be generated automatically
                        </p>
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
