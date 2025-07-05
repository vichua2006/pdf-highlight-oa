import { openaiKey } from "./env"
// https://stackoverflow.com/questions/64189359/reading-pdf-from-url-with-node-js-using-pdf-js
import * as pdfjs from "pdfjs-dist/legacy/build/pdf";
export interface PageEmbedding {
  pageNumber: number;
  text: string;
  embedding: number[];
  pdfId: string;
}

export const extractPageText = async (pdfUrl: string, pageNumber: number): Promise<string> => {
  const pdf = await pdfjs.getDocument(pdfUrl).promise;
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();

  // Concatenate all text items
  const text = textContent.items
    .map((item: any) => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
};

export const getPageEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
};

// TODO: use the ocr'ed pdf as the link for pdfUrl
export const getAllPageEmbeddings = async (pdfUrl: string, pdfId: string): Promise<PageEmbedding[]> => {
  const pdf = await pdfjs.getDocument(pdfUrl).promise;
  const numPages = pdf.numPages;
  const embeddings: PageEmbedding[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const text = await extractPageText(pdfUrl, pageNum);

    // Skip empty pages
    if (!text.trim()) continue;

    const embedding = await getPageEmbedding(text);

    embeddings.push({
      pageNumber: pageNum,
      text,
      embedding,
      pdfId,
    });
  }

  return embeddings;
}; 