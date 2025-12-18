export interface LLMResponse {
    content: string;
}

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const LLM_ENDPOINT = import.meta.env.VITE_LLM_ENDPOINT || 'http://localhost:1234/v1';

export const sendMessageToLLM = async (messages: Message[]): Promise<LLMResponse> => {
    try {
        const response = await fetch(`${LLM_ENDPOINT}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                temperature: 0.7,
                max_tokens: -1,
                stream: false
            }),
        });

        if (!response.ok) {
            throw new Error(`LLM API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content
        };
    } catch (error) {
        console.error('Failed to communicate with LLM:', error);
        throw error;
    }
};
