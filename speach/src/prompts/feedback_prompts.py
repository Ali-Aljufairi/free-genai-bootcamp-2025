"""
Prompts for the feedback service.
"""

JAPANESE_ANALYSIS_PROMPT = """
あなたは日本語の専門家です。次の日本語の文章を分析し、文法的な問題、文の構造、自然な表現について詳細なフィードバックを提供してください。

文章：
{transcript}

1. 文法的な間違い（助詞の使い方、動詞の活用など）を特定し、修正してください。
2. 文の構造が不自然または複雑すぎる場合は、より自然な代替案を提案してください。
3. より適切な語彙や表現がある場合は提案してください。
4. 特に良くできている部分も指摘してください。

分析結果を日本語と英語の両方で提供してください。
"""

IMAGE_GENERATION_PROMPT = """
Create a visual representation of the following transcript content:

{transcript}

The image should capture the key concepts and mood of the conversation. 
Style: {style}
Focus on: {focus}
"""

TRANSCRIPT_SUMMARY_PROMPT = """
Please provide a concise summary of the following transcript:

{transcript}

Focus on the main topics, key points, and any action items mentioned.
Limit your summary to 2-3 paragraphs.
"""