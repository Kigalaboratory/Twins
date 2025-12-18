import React, { useState, useEffect, useRef } from 'react';
import { Message, sendMessageToLLM } from '../services/llm';
import { INTERVIEW_TOPICS } from '../types/questions';
import { 
    generateTopicSystemPrompt, 
    shouldMoveToNextTopic, 
    getTopicCompletionMessage,
    createInitialState,
    advanceTopic,
    isInterviewComplete,
    InterviewState
} from '../logic/InterviewerAgent';
import { parseAIResponse } from '../utils/responseParser';
import QuestionView from './QuestionView';
import ProgressBar from './ProgressBar';

interface ConversationTurn {
    question: string;
    options?: string[];
    answer: string;
    timestamp: Date;
    topicId: string;
}

const ChatInterface: React.FC = () => {
    const [interviewState, setInterviewState] = useState<InterviewState>(createInitialState());
    const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<{ text: string; options?: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationHistory, currentQuestion]);

    // localStorageから復元
    useEffect(() => {
        const savedState = localStorage.getItem('interview_state');
        const savedHistory = localStorage.getItem('conversation_history');
        
        if (savedState && savedHistory) {
            setInterviewState(JSON.parse(savedState));
            setConversationHistory(JSON.parse(savedHistory));
            setIsInitialized(true);
        }
    }, []);

    // 初回質問を生成
    useEffect(() => {
        if (!isInitialized && !isLoading && !currentQuestion) {
            generateNextQuestion();
            setIsInitialized(true);
        }
    }, [isInitialized, isLoading, currentQuestion]);

    // 次の質問を生成
    const generateNextQuestion = async () => {
        if (isInterviewComplete(interviewState)) {
            // インタビュー完了
            localStorage.setItem('interview_completed', 'true');
            return;
        }

        setIsLoading(true);
        
        try {
            const currentTopic = INTERVIEW_TOPICS[interviewState.currentTopicIndex];
            const systemPrompt = generateTopicSystemPrompt(currentTopic, interviewState.currentTopicTurnCount);
            
            // 会話履歴を構築
            const messages: Message[] = [
                { role: 'system', content: systemPrompt },
                ...interviewState.conversationHistory,
            ];
            
            // LLMに質問を生成させる
            const response = await sendMessageToLLM(messages);
            
            // 応答をパース
            const parsed = parseAIResponse(response.content);
            
            setCurrentQuestion({
                text: parsed.text,
                options: parsed.options
            });
            
        } catch (error) {
            console.error('Failed to generate question:', error);
            setCurrentQuestion({
                text: 'エラーが発生しました。LLMの接続を確認してください。',
                options: undefined
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ユーザーの回答を処理
    const handleAnswer = async (answer: string) => {
        if (!currentQuestion) return;
        
        // 回答を履歴に追加
        const turn: ConversationTurn = {
            question: currentQuestion.text,
            options: currentQuestion.options,
            answer,
            timestamp: new Date(),
            topicId: INTERVIEW_TOPICS[interviewState.currentTopicIndex].id
        };
        
        const newHistory = [...conversationHistory, turn];
        setConversationHistory(newHistory);
        
        // 会話履歴をメッセージ形式に変換
        const newMessages: Message[] = [
            ...interviewState.conversationHistory,
            { role: 'assistant', content: currentQuestion.text },
            { role: 'user', content: answer }
        ];
        
        // 状態を更新
        const newState: InterviewState = {
            ...interviewState,
            currentTopicTurnCount: interviewState.currentTopicTurnCount + 1,
            conversationHistory: newMessages
        };
        
        // 次のトピックに移行すべきか判定
        const currentTopic = INTERVIEW_TOPICS[interviewState.currentTopicIndex];
        const shouldAdvance = shouldMoveToNextTopic(
            newState.currentTopicTurnCount,
            currentTopic,
            answer
        );
        
        let finalState = newState;
        if (shouldAdvance) {
            finalState = advanceTopic(newState);
            
            // トピック完了メッセージを表示（オプション）
            const nextTopic = finalState.currentTopicIndex < INTERVIEW_TOPICS.length 
                ? INTERVIEW_TOPICS[finalState.currentTopicIndex] 
                : undefined;
            const completionMsg = getTopicCompletionMessage(currentTopic, nextTopic);
            console.log(completionMsg);
        }
        
        setInterviewState(finalState);
        
        // localStorageに保存
        localStorage.setItem('interview_state', JSON.stringify(finalState));
        localStorage.setItem('conversation_history', JSON.stringify(newHistory));
        
        // 現在の質問をクリア
        setCurrentQuestion(null);
        
        // 次の質問を生成
        setTimeout(() => {
            generateNextQuestion();
        }, 500);
    };

    const isCompleted = isInterviewComplete(interviewState);

    return (
        <div className="interview-container">
            <ProgressBar 
                currentTopicIndex={interviewState.currentTopicIndex}
                currentTopicTurnCount={interviewState.currentTopicTurnCount}
            />
            
            <div className="chat-container glass-panel">
                <div className="messages-area">
                    {/* 過去の質問と回答を表示 */}
                    {conversationHistory.map((turn, idx) => (
                        <div key={idx} className="qa-pair">
                            <div className="message-bubble assistant">
                                <div className="question-label">
                                    {INTERVIEW_TOPICS.find(t => t.id === turn.topicId)?.name}
                                </div>
                                <div className="message-content">{turn.question}</div>
                                {turn.options && (
                                    <div className="shown-options">
                                        {turn.options.map((opt, i) => (
                                            <span key={i} className="option-tag">{opt}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="message-bubble user">
                                <div className="message-content">{turn.answer}</div>
                            </div>
                        </div>
                    ))}
                    
                    {/* 現在の質問 */}
                    {!isCompleted && currentQuestion && (
                        <div className="current-question">
                            <div className="message-bubble assistant">
                                <div className="question-label">
                                    {INTERVIEW_TOPICS[interviewState.currentTopicIndex]?.name}
                                </div>
                                <div className="message-content">{currentQuestion.text}</div>
                            </div>
                            
                            <QuestionView
                                question={{
                                    id: conversationHistory.length + 1,
                                    part: 'A',
                                    type: currentQuestion.options ? 
                                        (currentQuestion.options.length === 2 ? 'binary' : 'multiple') : 
                                        'text',
                                    text: '',
                                    options: currentQuestion.options,
                                    placeholder: '自由に回答することもできます...'
                                }}
                                onAnswer={handleAnswer}
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                    
                    {isLoading && !currentQuestion && (
                        <div className="loading-indicator">
                            次の質問を生成中...
                        </div>
                    )}
                    
                    {isCompleted && (
                        <div className="completion-message glass-panel">
                            <h2>🎉 インタビュー完了！</h2>
                            <p>全{INTERVIEW_TOPICS.length}トピックについて伺いました。</p>
                            <p>合計{conversationHistory.length}往復の対話をありがとうございました。</p>
                            <p>あなたのデジタルツインを生成しています...</p>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
