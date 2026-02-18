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
            return ["#mock", "#test", "#fun"];
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
}

export default new AIService();
