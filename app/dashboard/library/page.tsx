"use client"

import { LibraryContent } from "@/components/features/library/library-content"
import { UploadModal } from "@/components/features/library/upload-modal"

export default function LibraryPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Library</h2>
                <UploadModal />
            </div>

            <LibraryContent books={[]} />
        </div>
    )
}
