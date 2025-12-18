import React, { useState } from 'react';
import { INTERVIEW_TOPICS, CATEGORY_INFO, getTopicCategory } from '../types/questions';

interface ProgressBarProps {
    currentTopicIndex: number;
    currentTopicTurnCount: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentTopicIndex, currentTopicTurnCount }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const totalTopics = INTERVIEW_TOPICS.length;
    const completedTopics = currentTopicIndex;
    const percentage = Math.round((completedTopics / totalTopics) * 100);
    
    // 現在のトピック情報
    const currentTopic = currentTopicIndex < totalTopics ? INTERVIEW_TOPICS[currentTopicIndex] : null;
    
    // 推定残り時間（各トピック平均2.5往復 × 1分 = 2.5分）
    const remainingTopics = totalTopics - completedTopics;
    const estimatedMinutesLeft = Math.ceil(remainingTopics * 2.5);
    
    return (
        <div className="progress-container">
            <div 
                className="progress-summary"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="progress-text">
                    トピック: {completedTopics}/{totalTopics}
                </span>
                <span className="progress-percentage">{percentage}%</span>
                <span className="progress-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            
            {isExpanded && (
                <div className="progress-details">
                    {currentTopic && (
                        <div className="current-topic-info">
                            <div className="topic-badge">
                                {getTopicCategory(currentTopic.id)?.emoji} 進行中
                            </div>
                            <div className="topic-name">{currentTopic.name}</div>
                            <div className="topic-turns">
                                {currentTopicTurnCount}/{currentTopic.maxTurns} 往復
                            </div>
                        </div>
                    )}
                    
                    <div className="topics-list">
                        {INTERVIEW_TOPICS.map((topic, index) => {
                            const categoryInfo = CATEGORY_INFO[topic.category];
                            const status = 
                                index < currentTopicIndex ? 'completed' :
                                index === currentTopicIndex ? 'current' :
                                'pending';
                            
                            return (
                                <div key={topic.id} className={`topic-item ${status}`}>
                                    <div className="topic-item-header">
                                        <span className="topic-emoji">{categoryInfo.emoji}</span>
                                        <span className="topic-item-name">{topic.name}</span>
                                        {status === 'completed' && <span className="status-icon">✓</span>}
                                        {status === 'current' && <span className="status-icon">●</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="estimated-time">
                        推定残り時間: {estimatedMinutesLeft}分
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
