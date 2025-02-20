import os
import json
from datetime import datetime

class QuestionManager:
    def __init__(self):
        self.questions_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "backend/data/stored_questions.json"
        )
    
    def load_stored_questions(self):
        """Load previously stored questions from JSON file"""
        if os.path.exists(self.questions_file):
            with open(self.questions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_question(self, question, practice_type, topic, audio_file=None):
        """Save a generated question to JSON file"""
        # Load existing questions
        stored_questions = self.load_stored_questions()
        
        # Create a unique ID for the question using timestamp
        question_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Add metadata
        question_data = {
            "question": question,
            "practice_type": practice_type,
            "topic": topic,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "audio_file": audio_file
        }
        
        # Add to stored questions
        stored_questions[question_id] = question_data
        
        # Save back to file
        os.makedirs(os.path.dirname(self.questions_file), exist_ok=True)
        with open(self.questions_file, 'w', encoding='utf-8') as f:
            json.dump(stored_questions, f, ensure_ascii=False, indent=2)
        
        return question_id