export interface LLMResponse {
    content: string;
}

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514'; // 最新のSonnet 4

export const sendMessageToLLM = async (messages: Message[]): Promise<LLMResponse> => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set. Please add it to your .env file.');
    }

    try {
        // Claude APIはsystem messageを別パラメータで受け取る
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const conversationMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role,
                content: m.content
            }));

        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 4096,
                system: systemMessage,
                messages: conversationMessages,
                temperature: 0.7
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Claude API Error: ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text
        };
    } catch (error) {
        console.error('Failed to communicate with Claude API:', error);
        throw error;
    }
};
