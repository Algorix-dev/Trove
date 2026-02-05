import * as pdfjs from 'pdfjs-dist';

// We need to set up the worker for pdfjs-dist to work in a Node environment.
// In newer versions of pdfjs-dist, we can sometimes avoid this for text extraction
// but it's safer to ensure it's handled or use the legacy build if available.

export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
    if (fileType === 'pdf') {
        try {
            const data = new Uint8Array(buffer);
            const loadingTask = pdfjs.getDocument({
                data,
                useSystemFonts: true,
                disableFontFace: true,
                // Setting this to null or excluding it sometimes helps in Node
                isEvalSupported: false,
            });
            const pdfDocument = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => ('str' in item ? item.str : ''))
                    .join(' ');
                fullText += pageText + '\n';
            }

            return fullText;
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    if (fileType === 'txt') {
        return buffer.toString('utf-8');
    }

    // EPUB extraction server-side is more complex. 
    // For now, we'll return an empty string or a placeholder for unsupported formats
    return '';
}

export function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove non-printable chars
        .trim();
}
