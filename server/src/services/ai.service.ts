import { IAIService } from "./ai/ai.interface";
import { GeminiAIService } from "./ai/gemini.service";
import { MockAIService } from "./ai/mock.service";

class AIServiceFactory {
    static getService(): IAIService {
        const mockMode = process.env.LLM_MOCK_MODE || 'auto';
        const isDevelopmentOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

        let shouldUseMock = false;

        if (mockMode === 'always') {
            shouldUseMock = true;
        } else if (mockMode === 'auto') {
            shouldUseMock = isDevelopmentOrTest;
        } else if (mockMode === 'never') {
            shouldUseMock = false;
        } else {
            // Check legacy AI_MOCK_MODE just in case
            shouldUseMock = process.env.AI_MOCK_MODE === 'true';
        }

        if (shouldUseMock) {
            console.log(`[AI Configuration] Using MockAIService (LLM_MOCK_MODE=${mockMode}, NODE_ENV=${process.env.NODE_ENV}, SCENARIO=${process.env.LLM_MOCK_SCENARIO || 'success'})`);
            return new MockAIService();
        }

        console.log(`[AI Configuration] Using Real GeminiAIService (LLM_MOCK_MODE=${mockMode})`);
        return new GeminiAIService();
    }
}

// Export a singleton instance of the appropriate service
export default AIServiceFactory.getService();
