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
import { toast } from "sonner"

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

interface UploadModalProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function UploadModal({ open: controlledOpen, onOpenChange }: UploadModalProps = {}) {
    const [file, setFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    const router = useRouter()

    // Use controlled open state if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            const fileType = selectedFile.type
            const validTypes = ['application/pdf', 'application/epub+zip', 'text/plain']
            const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()
            const validExts = ['pdf', 'epub', 'txt']

            // Check file type
            if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
                toast.error("Invalid file type. Please upload a PDF, EPUB, or TXT file.")
                return
            }

            // Check file size (50MB limit)
            const maxSize = 50 * 1024 * 1024 // 50MB in bytes
            if (selectedFile.size > maxSize) {
                toast.error("File too large. Maximum size is 50MB.")
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
            const validTypes = ['application/pdf', 'application/epub+zip', 'text/plain']
            const fileExt = droppedFile.name.split('.').pop()?.toLowerCase()
            const validExts = ['pdf', 'epub', 'txt']

            // Check file type
            if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
                toast.error("Invalid file type. Please upload a PDF, EPUB, or TXT file.")
                return
            }

            // Check file size (50MB limit)
            const maxSize = 50 * 1024 * 1024
            if (droppedFile.size > maxSize) {
                toast.error("File too large. Maximum size is 50MB.")
                return
            }

            setFile(droppedFile)
        }
    }

    const handleUpload = async () => {
        if (!file || !user) return

        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase()

            // 1. Upload book file to storage
            const filePath = `${user.id}/${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(filePath, file)

            if (uploadError) {
                toast.error("Failed to upload file. Please try again.")
                console.error(uploadError)
                setUploading(false)
                return
            }

            // 2. Get public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('books')
                .getPublicUrl(filePath)

            // 3. Upload cover image if provided, otherwise generate gradient
            let coverUrl = `gradient:${generateGradient(file.name)}`
            if (coverFile) {
                const coverPath = `${user.id}/covers/${Date.now()}_${coverFile.name}`
                const { error: coverError } = await supabase.storage
                    .from('books')
                    .upload(coverPath, coverFile)

                if (!coverError) {
                    const { data: { publicUrl: coverPublicUrl } } = supabase.storage
                        .from('books')
                        .getPublicUrl(coverPath)
                    coverUrl = coverPublicUrl
                }
            }

            // 4. Extract page count for PDFs
            let totalPages = 0
            if (fileExt === 'pdf') {
                try {
                    const arrayBuffer = await file.arrayBuffer()
                    const pdfJS = await import('pdfjs-dist')
                    pdfJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`

                    const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise
                    totalPages = pdf.numPages
                } catch (error) {
                    console.error('Failed to extract PDF page count:', error)
                    // Continue with totalPages = 0 if extraction fails
                }
            }

            // 5. Clean up book title
            const bookTitle = file.name
                .replace(/\.(pdf|epub|txt)$/i, '')
                .replace(/_/g, ' ')
                .replace(/^.*?_/, '')
                .trim()

            // 6. Insert record into database
            const { data: insertedBook, error: dbError } = await supabase
                .from('books')
                .insert({
                    user_id: user.id,
                    title: bookTitle,
                    author: "Unknown Author",
                    file_url: publicUrl,
                    cover_url: coverUrl,
                    format: fileExt || 'pdf',
                    total_pages: totalPages
                })
                .select()
                .single()

            if (dbError) {
                toast.error("Failed to save book details. Please try again.")
                console.error('Database insert error:', dbError)
                setUploading(false)
                return
            }


            toast.success("Book uploaded successfully!")
            setFile(null)
            setCoverFile(null)
            setOpen(false)

            // Force refresh the library page
            router.refresh()

            // Dispatch event to notify listeners (like library page) to refetch
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('book-uploaded'))
            }

            // Dispatch event to notify listeners (like library page) to refetch
            window.dispatchEvent(new Event('book-uploaded'))

            // Small delay then navigate to ensure data is fresh
            setTimeout(() => {
                router.push('/dashboard/library')
            }, 100)
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.")
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 hover:scale-105">
                    <Upload className="h-4 w-4 mr-2" /> Upload Book
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-card/95 backdrop-blur-xl duration-500 animate-in fade-in zoom-in-95">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Add to Library
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80">
                        Drag and drop your PDF, EPUB, or TXT files here.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                    {/* Book File Upload */}
                    <div
                        className={`
                            relative group border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer overflow-hidden
                            ${isDragging
                                ? "border-primary bg-primary/10 scale-[1.02]"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                            }
                            ${file ? "border-green-500/50 bg-green-500/5" : ""}
                        `}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                            {file ? (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                                        <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-base font-semibold text-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                                    </p>
                                </div>
                            ) : (
                                <div className="group-hover:-translate-y-1 transition-transform duration-300">
                                    <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/10 transition-colors">
                                        <Upload className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                                    </div>
                                    <p className="text-lg font-medium text-foreground">Click or drag to upload</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Supports PDF, EPUB, TXT (Max 50MB)
                                    </p>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.epub,.txt"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Cover Image Upload (Optional) */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                            <ImageIcon className="h-4 w-4" /> Cover Image <span className="text-xs font-normal text-muted-foreground ml-auto">(Optional)</span>
                        </label>
                        <div
                            onClick={() => coverInputRef.current?.click()}
                            className="flex items-center gap-3 p-3 rounded-lg border border-input bg-background hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-muted-foreground/20 transition-colors">
                                {coverFile ? (
                                    <ImageIcon className="h-5 w-5 text-primary" />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-md" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {coverFile ? coverFile.name : "Select a cover image"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {coverFile ? "Click to change" : "or leave empty for auto-generated cover"}
                                </p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8">Browse</Button>
                        </div>
                        <Input
                            type="file"
                            ref={coverInputRef}
                            accept="image/*"
                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="min-w-[120px] bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload Book"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
