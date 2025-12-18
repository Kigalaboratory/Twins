import { Message } from '../services/llm';
import { INTERVIEW_TOPICS, InterviewTopic } from '../types/questions';

// グローバルシステムプロンプト
export const BASE_SYSTEM_PROMPT = `
あなたは熟練した伝記作家であり、臨床心理学者です。
人の「属性」ではなく、「物語」と「行動パターン」を聞き出してください。

【全体の目標】
ユーザーの価値観、行動パターン、Critical Moments、本音と建前を引き出し、
高精度なデジタルツイン（ペルソナ）を作成するためのデータを収集します。

【重要な原則】
1. 質問は一度に一つだけ行ってください
2. 抽象的な回答には必ず具体的なエピソードを求めてください
3. 選択肢がある質問では、以下の形式で出力してください：
   
   質問文
   選択肢: [選択肢A] [選択肢B] [選択肢C]
   
4. 「心の中で思ったこと」と「実際の行動」を分けて聞いてください
5. ユーザーの言葉を引用して深掘りしてください

【選択肢の扱い】
- 選択肢を提示しても、ユーザーは自由に回答できます
- 選択肢はガイドとして提供してください
`;

// トピックごとのシステムプロンプトを生成
export const generateTopicSystemPrompt = (topic: InterviewTopic, turnCount: number): string => {
    return `${BASE_SYSTEM_PROMPT}

【現在のトピック】
${topic.name}

${topic.systemPrompt}

【現在の状況】
- このトピックでの質問回数: ${turnCount}回目
- 最小往復数: ${topic.minTurns}回
- 最大往復数: ${topic.maxTurns}回

${turnCount >= topic.minTurns ? '※ このトピックは最小往復数に達しています。十分な情報が得られたら次のトピックに移行できます。' : ''}
${turnCount >= topic.maxTurns ? '※ このトピックは最大往復数に達しています。このターンで完了してください。' : ''}
`;
};

// 次のトピックへの遷移判定
export const shouldMoveToNextTopic = (
    turnCount: number,
    topic: InterviewTopic,
    userResponse: string
): boolean => {
    // 最大往復数に達したら必ず次へ
    if (turnCount >= topic.maxTurns) {
        return true;
    }
    
    // 最小往復数に達していない場合は継続
    if (turnCount < topic.minTurns) {
        return false;
    }
    
    // 最小〜最大の間の場合、ユーザーの回答の充実度で判断
    // 簡易的な判定：回答が短すぎる場合は継続
    const responseLength = userResponse.trim().length;
    if (responseLength < 20) {
        return false;
    }
    
    // 十分な情報が得られたと判断
    return true;
};

// トピック完了時のメッセージ
export const getTopicCompletionMessage = (topic: InterviewTopic, nextTopic?: InterviewTopic): string => {
    if (!nextTopic) {
        return `\n\n【インタビュー完了】\nすべてのトピックが完了しました。ありがとうございました。`;
    }
    
    return `\n\n【次のトピックへ】\n「${topic.name}」についての質問を終了します。\n次は「${nextTopic.name}」について伺います。`;
};

// インタビュー状態管理
export interface InterviewState {
    currentTopicIndex: number;
    currentTopicTurnCount: number;
    conversationHistory: Message[];
    topicHistory: {
        topicId: string;
        turns: number;
        completed: boolean;
    }[];
}

export const createInitialState = (): InterviewState => {
    return {
        currentTopicIndex: 0,
        currentTopicTurnCount: 0,
        conversationHistory: [],
        topicHistory: []
    };
};

// トピック進行管理
export const advanceTopic = (state: InterviewState): InterviewState => {
    const currentTopic = INTERVIEW_TOPICS[state.currentTopicIndex];
    
    // 現在のトピックを履歴に追加
    const newTopicHistory = [
        ...state.topicHistory,
        {
            topicId: currentTopic.id,
            turns: state.currentTopicTurnCount,
            completed: true
        }
    ];
    
    // 次のトピックへ
    return {
        ...state,
        currentTopicIndex: state.currentTopicIndex + 1,
        currentTopicTurnCount: 0,
        topicHistory: newTopicHistory
    };
};

export const isInterviewComplete = (state: InterviewState): boolean => {
    return state.currentTopicIndex >= INTERVIEW_TOPICS.length;
};
