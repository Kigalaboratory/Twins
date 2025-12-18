import React, { useState, useEffect, useRef } from 'react';
import { Message, sendMessageToLLM } from '../services/llm';
import { SYSTEM_PROMPT_INTERVIEWER } from '../logic/InterviewerAgent';

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: SYSTEM_PROMPT_INTERVIEWER },
        { role: 'assistant', content: 'こんにちは。あなたの物語を聞かせてください。まずは、あなたの人生を本の章に分けるとしたら、現在の章のタイトルは何ですか？' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendMessageToLLM(newMessages);
            setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: '申し訳ありません。エラーが発生しました。LLMの接続を確認してください。' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container glass-panel">
            <div className="messages-area">
                {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                    <div key={idx} className={`message-bubble ${msg.role}`}>
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                {isLoading && <div className="loading-indicator">Thinking...</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-area">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="あななお話を聞かせてください..."
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    送信
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
