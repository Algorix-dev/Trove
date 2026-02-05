import pdf from 'pdf-parse';

export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
    if (fileType === 'pdf') {
        try {
            const data = await pdf(buffer);
            return data.text;
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
    // In a real app, you might use a library like 'epub-ps' or similar
    return '';
}

export function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove non-printable chars
        .trim();
}
