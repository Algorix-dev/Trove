"use client"

import { BookOpen } from "lucide-react"
import { UploadModal } from "./upload-modal"
import { useState } from "react"

export function EmptyLibrary() {
    const [uploadOpen, setUploadOpen] = useState(false)

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Your library is empty</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
                Start building your digital library by uploading your first book
            </p>
            <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
        </div>
    )
}
