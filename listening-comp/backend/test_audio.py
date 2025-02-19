import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.audio_generator import AudioGenerator

# Test question data
test_question = {
    "Introduction": "次の会話を聞いて、質問に答えてください。",
    "Conversation": """
    男性: すみません、この電車は新宿駅に止まりますか。
    女性: はい、次の駅が新宿です。
    男性: ありがとうございます。何分くらいかかりますか。
    女性: そうですね、5分くらいです。
    """,
    "Question": "新宿駅まで何分かかりますか。",
    "Options": [
        "3分です。",
        "5分です。",
        "10分です。",
        "15分です。"
    ]
}

def test_audio_generation():
    print("Initializing audio generator...")
    generator = AudioGenerator()
    
    print("\nParsing conversation...")
    parts = generator.parse_conversation(test_question)
    
    print("\nParsed conversation parts:")
    for speaker, text, gender in parts:
        print(f"Speaker: {speaker} ({gender})")
        print(f"Text: {text}")
        print("---")
    
    print("\nGenerating audio file...")
    audio_file = generator.generate_audio(test_question)
    print(f"Audio file generated: {audio_file}")
    
    return audio_file

if __name__ == "__main__":
    try:
        audio_file = test_audio_generation()
        print("\nTest completed successfully!")
        print(f"You can find the audio file at: {audio_file}")
    except Exception as e:
        print(f"\nError during test: {str(e)}")
