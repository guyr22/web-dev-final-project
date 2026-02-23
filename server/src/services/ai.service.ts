import { GoogleGenerativeAI } from "@google/generative-ai";

class AIService {
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
        // Mock Mode check
        if (process.env.AI_MOCK_MODE === "true") {
            return ["#mock", "#test", "#AI"];
        }

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
            
            // Basic cleaning to extract the JSON array if the model includes Markdown formatting
            // e.g. ```json ["#tag1", "#tag2"] ```
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const tags = JSON.parse(jsonMatch[0]);
                if (Array.isArray(tags)) {
                    return tags.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`);
                }
            }
            
            // Fallback if parsing fails but some text was returned
             console.warn("Failed to parse AI response as JSON array:", text);
             return [];

        } catch (error) {
            console.error("AI Service Error:", error);
            // Return empty array instead of crashing
            return [];
        }
    }
    async parseSearchQuery(freeText: string): Promise<string[]> {
        // Mock Mode check
        if (process.env.AI_MOCK_MODE === "true") {
            // Provide a hardcoded array of mock search keywords
            return ["#mock", "#test", "#AI"];
        }

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
            console.error("AI Service Error:", error);
            return [];
        }
    }
}

export default new AIService();
