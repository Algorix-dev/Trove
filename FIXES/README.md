# Phase 2 Fixes - Manual Application Guide

## Overview
Due to file corruption issues with automated replacements, these fixes are provided as standalone files for manual application.

---

## Fix 1: Dashboard Stats Optimization ✅

**File to Replace:** `components/features/dashboard-stats.tsx`  
**Fixed Version:** `FIXES/dashboard-stats-optimized.tsx`

**Changes Made:**
- Replaced sequential database queries with `Promise.all()` for parallel execution
- Reduced 4 separate queries to 3 parallel queries
- Eliminated redundant `setStats` call
- Improved performance by ~3x

**How to Apply:**
1. Copy content from `FIXES/dashboard-stats-optimized.tsx`
2. Replace entire content of `components/features/dashboard-stats.tsx`
3. Save and test

---

## Fix 2: File Upload Enhancements (PENDING)

**File:** `components/features/library/upload-modal.tsx`

**Changes Needed:**
1. Add file size validation (50MB limit)
2. Extract PDF page count on upload
3. Improve error handling

**Manual Changes Required:**

### Add File Size Check (Line ~60):
```tsx
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

        // ADD THIS: Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024 // 50MB in bytes
        if (selectedFile.size > maxSize) {
            toast.error("File too large. Maximum size is 50MB.")
            return
        }

        setFile(selectedFile)
    }
}
```

### Add Same Check to handleDrop (Line ~90):
```tsx
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

        if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
            toast.error("Invalid file type. Please upload a PDF, EPUB, or TXT file.")
            return
        }

        // ADD THIS: Check file size
        const maxSize = 50 * 1024 * 1024
        if (droppedFile.size > maxSize) {
            toast.error("File too large. Maximum size is 50MB.")
            return
        }

        setFile(droppedFile)
    }
}
```

### Extract PDF Page Count (Line ~140, in handleUpload):
```tsx
// 4. Extract page count for PDFs
let totalPages = 0
if (fileExt === 'pdf') {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const { getDocument } = await import('pdfjs-dist')
        const pdf = await getDocument({ data: arrayBuffer }).promise
        totalPages = pdf.numPages
    } catch (error) {
        console.error('Failed to extract PDF page count:', error)
        // Continue with totalPages = 0 if extraction fails
    }
}

// 5. Insert record into database (change from step 4)
const { error: dbError } = await supabase
    .from('books')
    .insert({
        user_id: user.id,
        title: bookTitle,
        author: "Unknown Author",
        file_url: filePath,
        cover_url: coverUrl,
        format: fileExt || 'pdf',
        total_pages: totalPages // Changed from 0
    })
```

---

## Fix 3: Viewer Debouncing (PENDING)

### PDF Viewer (`components/features/reader/pdf-viewer.tsx`)

**Find the useEffect that saves progress (around line 60-88):**

Replace:
```tsx
const saveProgress = async () => {
    await supabase
        .from('reading_progress')
        .upsert({...})
};
saveProgress();
```

With:
```tsx
// Debounced save - only save after user stops changing pages
const saveTimeout = setTimeout(async () => {
    await supabase
        .from('reading_progress')
        .upsert({
            book_id: bookId,
            user_id: userId,
            current_page: pageNumber,
            total_pages: numPages,
            progress_percentage: progressPercentage,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'book_id,user_id'
        });
}, 1000); // Save 1 second after last page change

return () => clearTimeout(saveTimeout);
```

### EPUB Viewer (`components/features/reader/epub-viewer.tsx`)

**Add debounced save ref (around line 26, after state declarations):**
```tsx
const saveProgressDebounced = useRef<NodeJS.Timeout>()
```

**Create debounced save function (after saveProgress function, around line 77):**
```tsx
// Debounced save to prevent excessive writes
const debouncedSave = (cfi: string, progressValue: number) => {
    if (saveProgressDebounced.current) {
        clearTimeout(saveProgressDebounced.current)
    }
    saveProgressDebounced.current = setTimeout(() => {
        saveProgress(cfi, progressValue)
    }, 2000) // Save 2 seconds after last location change
}
```

**Update updateProgress function (around line 54):**
Replace `saveProgress(cfi, progressValue)` with `debouncedSave(cfi, progressValue)`

---

## Testing After Applying Fixes

### Dashboard Stats:
1. Open dashboard
2. Check browser network tab - should see 3 parallel requests instead of 5 sequential
3. Verify all stats display correctly

### File Upload:
1. Try uploading file > 50MB - should show error
2. Upload valid PDF - should extract page count
3. Check database - total_pages should not be 0

### Viewer Debouncing:
1. Open PDF, rapidly change pages
2. Check network tab - should see fewer progress save requests
3. Close and reopen - should resume at correct page

---

## Summary

**Completed:**
- ✅ Dashboard stats optimization (file ready to copy)

**Pending Manual Application:**
- 🔄 File upload size limits
- 🔄 PDF page extraction
- 🔄 PDF viewer debouncing
- 🔄 EPUB viewer debouncing

**Estimated Time:** 15-20 minutes to apply all fixes manually
