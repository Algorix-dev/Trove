import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

import { ReaderLayout } from '@/components/features/reader/reader-layout';
import { createClient } from '@/lib/supabase/server';

// Lazy load viewer components for better performance
const PDFViewer = dynamic(
  () =>
    import('@/components/features/reader/pdf-viewer').then((mod) => ({ default: mod.PDFViewer })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

const EpubViewer = dynamic(
  () =>
    import('@/components/features/reader/epub-viewer').then((mod) => ({ default: mod.EpubViewer })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

const TxtViewer = dynamic(
  () =>
    import('@/components/features/reader/txt-viewer').then((mod) => ({ default: mod.TxtViewer })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: book } = await supabase.from('books').select('*').eq('id', id).single();

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Book not found</h1>
          <p className="text-muted-foreground">
            The book you're looking for doesn't exist or you don't have access to it.
          </p>
          <a
            href="/dashboard/library"
            className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Return to Library
          </a>
        </div>
      </div>
    );
  }

  // Get signed URL for the file if it's a storage path, otherwise use the URL directly
  let fileUrl = book.file_url;
  // If file_path is available, always use it to generate a signed URL as the books bucket is private
  if (book.file_path) {
    const { data } = await supabase.storage.from('books').createSignedUrl(book.file_path, 3600); // 1 hour expiry
    fileUrl = data?.signedUrl || book.file_url;
  } else if (book.file_url && !book.file_url.startsWith('http')) {
    // Fallback for older records that might only have a relative path in file_url
    const { data } = await supabase.storage.from('books').createSignedUrl(book.file_url, 3600);
    fileUrl = data?.signedUrl || book.file_url;
  }
  const format = book.format || 'pdf';

  // Extract bookmark navigation params
  const bookmarkPage = search['page'] ? parseInt(search['page'] as string) : undefined;
  const bookmarkCFI = search['cfi'] as string | undefined;
  const bookmarkProgress = search['progress']
    ? parseFloat(search['progress'] as string)
    : undefined;

  return (
    <ReaderLayout title={book.title} bookId={id} userId={user.id}>
      {format === 'epub' ? (
        <EpubViewer url={fileUrl} userId={user.id} bookId={id} initialLocation={bookmarkCFI} />
      ) : format === 'txt' ? (
        <TxtViewer url={fileUrl} userId={user.id} bookId={id} initialLocation={bookmarkProgress} />
      ) : (
        <PDFViewer fileUrl={fileUrl} bookId={id} userId={user.id} initialPage={bookmarkPage} />
      )}
    </ReaderLayout>
  );
}
