import { GoogleGenerativeAI } from "@google/generative-ai";
import { IAIService } from "./ai.interface";

export class GeminiAIService implements IAIService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    private init() {
        if (!this.genAI) {
            const apiKey = process.env.GEMINI_API_KEY || "";
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        }
    }

    async generateTags(content: string): Promise<string[]> {
        try {
            this.init();
            
            if (!process.env.GEMINI_API_KEY) {
                console.warn("GEMINI_API_KEY is missing, returning empty tags");
                return [];
            }
            const prompt = `Analyze this text and generate 3 relevant hashtags. Return ONLY the hashtags in a JSON array. Text: "${content}"`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const tags = JSON.parse(jsonMatch[0]);
                if (Array.isArray(tags)) {
                    return tags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`);
                }
            }
            
            console.warn("Failed to parse AI response as JSON array:", text);
            return [];
        } catch (error) {
            console.error("Gemini AI Service Error:", error);
            return [];
        }
    }

    async parseSearchQuery(freeText: string): Promise<string[]> {
        try {
            this.init();
            
            if (!process.env.GEMINI_API_KEY) {
                console.warn("GEMINI_API_KEY is missing, returning empty array");
                return [];
            }
            const prompt = `Extract exactly 2 to 3 main keywords or search terms from this user query. Return ONLY a JSON array of strings in lowercase, prepended with a hash symbol if they are topics. Query: "${freeText}"`;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const keywords = JSON.parse(jsonMatch[0]);
                if (Array.isArray(keywords)) {
                    return keywords.map((kw: string) => {
                        const lowerKw = kw.toLowerCase();
                        return lowerKw.startsWith('#') ? lowerKw : `#${lowerKw}`;
                    });
                }
            }
            
            console.warn("Failed to parse AI response as JSON array:", text);
            return [];
        } catch (error) {
            console.error("Gemini AI Service Error:", error);
            return [];
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            this.init();
            
            if (!process.env.GEMINI_API_KEY) {
                console.warn("GEMINI_API_KEY is missing, returning empty embedding");
                return [];
            }
            
            // We use the gemini-embedding-001 model for embeddings as it replaced the older embedding-001 and text-embedding-004 models
            const embeddingModel = this.genAI!.getGenerativeModel({ model: "gemini-embedding-001"});
            
            const result = await embeddingModel.embedContent(text);
            const embedding = result.embedding;
            return embedding.values;
        } catch (error) {
            console.error("Gemini AI Service Error (generateEmbedding):", error);
            return [];
        }
    }
}
