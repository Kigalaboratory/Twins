import React, { useState } from 'react';
import { Question } from '../types/questions';

interface QuestionViewProps {
    question: Question;
    onAnswer: (answer: string) => void;
    isLoading?: boolean;
}

const QuestionView: React.FC<QuestionViewProps> = ({ question, onAnswer, isLoading }) => {
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    
    const handleTextSubmit = () => {
        if (textInput.trim()) {
            onAnswer(textInput.trim());
            setTextInput('');
            setShowTextInput(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextSubmit();
        }
    };
    
    const handleOptionClick = (option: string) => {
        onAnswer(option);
    };
    
    return (
        <div className="question-view">
            <div className="answer-area">
                {question.options && question.options.length > 0 && (
                    <>
                        <div className={`options-container ${question.type}`}>
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    className="option-button"
                                    onClick={() => handleOptionClick(option)}
                                    disabled={isLoading}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        
                        {!showTextInput && (
                            <button 
                                className="free-text-toggle"
                                onClick={() => setShowTextInput(true)}
                                disabled={isLoading}
                            >
                                または自由に回答する
                            </button>
                        )}
                    </>
                )}
                
                {(question.type === 'text' || showTextInput || !question.options) && (
                    <div className="text-input-area">
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={question.placeholder || 'あなたの回答を入力してください...'}
                            disabled={isLoading}
                            rows={4}
                            autoFocus
                        />
                        <div className="text-input-actions">
                            {showTextInput && (
                                <button
                                    className="cancel-button"
                                    onClick={() => {
                                        setShowTextInput(false);
                                        setTextInput('');
                                    }}
                                    disabled={isLoading}
                                >
                                    選択肢に戻る
                                </button>
                            )}
                            <button
                                className="submit-button"
                                onClick={handleTextSubmit}
                                disabled={isLoading || !textInput.trim()}
                            >
                                回答する
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {isLoading && (
                <div className="loading-indicator">
                    処理中...
                </div>
            )}
        </div>
    );
};

export default QuestionView;
