import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import { createRequire } from 'module';

// pdf-parse doesn't have proper ESM default export
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface ExtractedText {
  text: string;
  source: 'pdf' | 'image' | 'docx' | 'text';
  confidence?: number;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<ExtractedText> {
  const lowerName = originalName.toLowerCase();
  
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return extractFromPdf(buffer);
  }
  
  if (
    mimeType.startsWith('image/') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.gif') ||
    lowerName.endsWith('.webp')
  ) {
    return extractFromImage(buffer);
  }
  
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    return extractFromDocx(buffer);
  }
  
  if (mimeType === 'text/plain' || lowerName.endsWith('.txt')) {
    return {
      text: buffer.toString('utf-8'),
      source: 'text',
    };
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function extractFromPdf(buffer: Buffer): Promise<ExtractedText> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    
    if (text.length > 50) {
      return { text, source: 'pdf' };
    }
    
    console.log('PDF text extraction yielded little text - PDF may be image-based');
    throw new Error('PDF appears to be image-based. Please convert to a text-based PDF or upload as images for OCR.');
  } catch (error: any) {
    if (error.message?.includes('image-based')) {
      throw error;
    }
    console.error('PDF parsing failed:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the PDF is valid and contains selectable text.');
  }
}

async function extractFromImage(buffer: Buffer): Promise<ExtractedText> {
  try {
    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    const text = result.data.text.trim();
    const confidence = result.data.confidence;
    
    // Quality check: require minimum confidence and text length
    if (confidence < 30) {
      throw new Error(`OCR confidence too low (${Math.round(confidence)}%). Image may not contain readable text.`);
    }
    
    if (text.length < 20) {
      throw new Error('OCR extracted very little text. Image may not contain readable text.');
    }
    
    // Clean up common OCR artifacts
    const cleanedText = text
      .replace(/\n{3,}/g, '\n\n')  // Reduce excessive newlines
      .replace(/[ \t]{2,}/g, ' ')   // Reduce excessive spaces
      .trim();
    
    return {
      text: cleanedText,
      source: 'image',
      confidence,
    };
  } catch (error: any) {
    console.error('OCR failed:', error);
    throw new Error(error.message || 'Failed to extract text from image using OCR');
  }
}

async function extractFromDocx(buffer: Buffer): Promise<ExtractedText> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value.trim(),
      source: 'docx',
    };
  } catch (error) {
    console.error('DOCX parsing failed:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

export function truncateText(text: string, maxLength: number = 50000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '\n\n[Content truncated due to length...]';
}

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 10;
