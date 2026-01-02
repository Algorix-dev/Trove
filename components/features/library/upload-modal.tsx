'use client';

import { createBrowserClient } from '@supabase/ssr';
import { FileText, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Generate a beautiful gradient based on book title
function generateGradient(title: string): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

interface UploadModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadModal({
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: UploadModalProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      const validTypes = ['application/pdf', 'application/epub+zip', 'text/plain'];
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const validExts = ['pdf', 'epub', 'txt'];

      // Check file type
      if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
        toast.error('Invalid file type. Please upload a PDF, EPUB, or TXT file.');
        return;
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (selectedFile.size > maxSize) {
        toast.error('File too large. Maximum size is 50MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileType = droppedFile.type;
      const validTypes = ['application/pdf', 'application/epub+zip', 'text/plain'];
      const fileExt = droppedFile.name.split('.').pop()?.toLowerCase();
      const validExts = ['pdf', 'epub', 'txt'];

      // Check file type
      if (!validTypes.includes(fileType) && !validExts.includes(fileExt || '')) {
        toast.error('Invalid file type. Please upload a PDF, EPUB, or TXT file.');
        return;
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (droppedFile.size > maxSize) {
        toast.error('File too large. Maximum size is 50MB.');
        return;
      }

      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      // 1. Upload book file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('books').upload(filePath, file);

      if (uploadError) {
        toast.error('Failed to upload file. Please try again.');
        console.error(uploadError);
        setUploading(false);
        return;
      }

      // 2. Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from('books').getPublicUrl(filePath);

      // 3. Upload cover image if provided, otherwise generate gradient
      let coverUrl = `gradient:${generateGradient(file.name)}`;
      if (coverFile) {
        const coverPath = `${user.id}/covers/${Date.now()}_${coverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from('books')
          .upload(coverPath, coverFile);

        if (!coverError) {
          const {
            data: { publicUrl: coverPublicUrl },
          } = supabase.storage.from('books').getPublicUrl(coverPath);
          coverUrl = coverPublicUrl;
        }
      }

      // 4. Extract page count for PDFs
      let totalPages = 0;
      if (fileExt === 'pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfJS = await import('pdfjs-dist');
          // Use local worker to avoid CORS issues
          pdfJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

          const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;
          totalPages = pdf.numPages;
        } catch (error) {
          console.error('Failed to extract PDF page count:', error);
          // Continue with totalPages = 0 if extraction fails
        }
      }

      // 5. Clean up book title
      const bookTitle = file.name
        .replace(/\.(pdf|epub|txt)$/i, '')
        .replace(/_/g, ' ')
        .replace(/^.*?_/, '')
        .trim();

      // 6. Insert record into database
      const { data: insertedBook, error: dbError } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: bookTitle,
          author: 'Unknown Author',
          file_url: publicUrl,
          file_path: filePath,
          cover_url: coverUrl,
          format: fileExt || 'pdf',
          size_bytes: file.size,
          total_pages: totalPages,
        })
        .select()
        .maybeSingle();

      if (dbError) {
        console.error('Database insert error:', dbError);
        toast.error('Failed to save book details. Rolling back upload...');

        // Rollback: Delete file from storage to prevent ghost files
        const { error: deleteError } = await supabase.storage.from('books').remove([filePath]);

        if (deleteError) {
          console.error('Failed to rollback file upload:', deleteError);
        }

        setUploading(false);
        return;
      }

      console.log('[UploadModal] Successfully inserted book. User ID:', user.id);
      console.log('[UploadModal] Inserted book details:', insertedBook);
      toast.success('Book uploaded successfully!');
      setFile(null);
      setCoverFile(null);
      setOpen(false);

      // Trigger re-fetch if callback provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl gap-2 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105">
          <Upload className="h-5 w-5" />
          <span>Upload Treasure</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none bg-background/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Upload New Treasure</DialogTitle>
            <DialogDescription className="text-base">
              Select a PDF, EPUB, or TXT file to add to your collection.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            {/* Book File Upload */}
            <div
              className={`border-2 border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <div className="bg-primary/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-lg font-bold truncate max-w-full px-4">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-muted p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold">Drag & Drop</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, EPUB, or TXT (Max 50MB)</p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.epub,.txt"
                onChange={handleFileSelect}
              />
            </div>

            {/* Cover Image Upload (Optional) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="text-sm font-semibold">Custom Cover</label>
                <span className="text-xs text-muted-foreground italic">(Optional)</span>
              </div>
              <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-2xl border border-border/50">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl h-10 px-4"
                  onClick={() => coverInputRef.current?.click()}
                >
                  Choose Image
                </Button>
                <div className="flex-1 truncate">
                  {coverFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="truncate">{coverFile.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Auto-generated gradient</span>
                  )}
                </div>
                <input
                  type="file"
                  ref={coverInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Securing Treasure...</span>
                </>
              ) : (
                'Add to Collection'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
