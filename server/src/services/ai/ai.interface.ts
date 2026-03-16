export interface IAIService {
    generateTags(content: string): Promise<string[]>;
    parseSearchQuery(freeText: string): Promise<string[]>;
}
