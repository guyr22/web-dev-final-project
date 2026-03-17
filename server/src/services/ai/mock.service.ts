import { IAIService } from "./ai.interface";

export class MockAIService implements IAIService {
    private getDelay(): number {
        const defaultDelay = 1000;
        const envDelay = parseInt(process.env.LLM_MOCK_DELAY_MS || '1000', 10);
        return isNaN(envDelay) ? defaultDelay : envDelay;
    }

    private getScenario(): string {
        return (process.env.LLM_MOCK_SCENARIO || 'success').toLowerCase();
    }

    private simulateDelay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, this.getDelay()));
    }

    private checkScenario(action: string): void {
        const scenario = this.getScenario();
        if (scenario === 'error') {
            throw new Error(`[Mock Error] Simulated LLM failure during ${action}`);
        } else if (scenario === 'timeout') {
            throw new Error(`[Mock Error] Simulated LLM timeout during ${action}`);
        }
    }

    async generateTags(content: string): Promise<string[]> {
        await this.simulateDelay();
        
        try {
            this.checkScenario('generateTags');
        } catch (err: any) {
            console.error("Mock AI Service Error:", err.message);
            // In the real service we return [] on error, so we mimic that structure here
            return [];
        }

        const lowerContent = content.toLowerCase();
        
        // Simple pattern matching for deterministic tests
        if (lowerContent.includes('dog') || lowerContent.includes('cat')) {
            return ['#pets', '#animal', '#cute'];
        } else if (lowerContent.includes('code') || lowerContent.includes('programming')) {
            return ['#coding', '#tech', '#developer'];
        } else if (lowerContent.includes('food') || lowerContent.includes('recipe')) {
            return ['#foodie', '#delicious', '#cooking'];
        }

        return ["#mock", "#test", "#AI"];
    }

    async parseSearchQuery(freeText: string): Promise<string[]> {
        await this.simulateDelay();
        
        try {
            this.checkScenario('parseSearchQuery');
        } catch (err: any) {
            console.error("Mock AI Service Error:", err.message);
            return [];
        }

        const lowerText = freeText.toLowerCase();

        if (lowerText.includes('dog') || lowerText.includes('cat')) {
            return ['#pets', '#animal'];
        } else if (lowerText.includes('code') || lowerText.includes('tech')) {
            return ['#coding', '#tech'];
        } else if (lowerText.includes('food')) {
            return ['#foodie'];
        }

        return ["#mock", "#test", "#AI"]; // Match old fallback
    }

    async generateEmbedding(text: string): Promise<number[]> {
        await this.simulateDelay();

        try {
            this.checkScenario('generateEmbedding');
        } catch (err: any) {
            console.error("Mock AI Service Error:", err.message);
            return [];
        }

        // For testing purposes, we return a deterministic vector.
        // If we want different vectors for different text, we could hash it.
        // For now, returning a fixed vector ensures a similarity of 1.0 in tests.
        return new Array(384).fill(0.1);
    }
}
