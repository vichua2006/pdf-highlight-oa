import OpenAI from 'openai';
import * as pdfjs from "pdfjs-dist";
import { openAiKey } from "./env"

const openai = new OpenAI({
    apiKey: openAiKey
});

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
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    return response.data[0].embedding;
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