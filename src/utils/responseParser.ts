// LLMの応答をパースして質問と選択肢に分解
export interface ParsedQuestion {
    text: string;
    options?: string[];
    hasOptions: boolean;
}

export const parseAIResponse = (response: string): ParsedQuestion => {
    // パターン1: 選択肢が明示的にマークアップされている
    const optionPattern = /選択肢[:：]\s*(\[.+?\](?:\s*\[.+?\])*)/;
    const optionMatch = response.match(optionPattern);
    
    if (optionMatch) {
        // 選択肢部分を抽出
        const optionsText = optionMatch[1];
        const options = optionsText
            .match(/\[([^\]]+)\]/g)
            ?.map(opt => opt.replace(/[\[\]]/g, '').trim())
            .filter(opt => opt.length > 0) || [];
        
        // 質問テキストから選択肢部分を除去
        const text = response.replace(optionPattern, '').trim();
        
        return {
            text,
            options: options.length > 0 ? options : undefined,
            hasOptions: options.length > 0
        };
    }
    
    // パターン2: 自然言語で選択肢が書かれている
    // 例: "AかBか" "AとBのどちらか"
    const naturalChoicePatterns = [
        /「(.+?)」(?:と|か)「(.+?)」(?:、)?どちらを?/,
        /「(.+?)」(?:と|または)「(.+?)」/,
        /(\S+)(?:と|か|または)(\S+)(?:、)?どちら/
    ];
    
    for (const pattern of naturalChoicePatterns) {
        const match = response.match(pattern);
        if (match && match[1] && match[2]) {
            return {
                text: response,
                options: [match[1], match[2]],
                hasOptions: true
            };
        }
    }
    
    // パターン3: 選択肢なし（自由回答）
    return {
        text: response,
        options: undefined,
        hasOptions: false
    };
};

// テスト用ヘルパー
export const testParser = () => {
    const testCases = [
        {
            input: '「正直さ」と「優しさ」、どちらを優先しますか？\n選択肢: [正直さ] [優しさ]',
            expected: { hasOptions: true, options: ['正直さ', '優しさ'] }
        },
        {
            input: 'その時の具体的な状況を教えてください。',
            expected: { hasOptions: false }
        },
        {
            input: '「安定」と「成長」、どちらを選びますか？',
            expected: { hasOptions: true, options: ['安定', '成長'] }
        }
    ];
    
    console.log('=== Parser Test ===');
    testCases.forEach((test, idx) => {
        const result = parseAIResponse(test.input);
        console.log(`Test ${idx + 1}:`, result.hasOptions === test.expected.hasOptions ? '✓' : '✗');
    });
};
