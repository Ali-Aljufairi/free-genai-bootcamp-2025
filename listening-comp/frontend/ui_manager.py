import streamlit as st
from question_manager import QuestionManager
from audio_manager import AudioManager
from backend.question_generator import QuestionGenerator
from backend.audio_generator import AudioGenerator

class UIManager:
    def __init__(self):
        self.question_manager = QuestionManager()
        self.audio_manager = AudioManager()
        
    def initialize_session_state(self):
        """Initialize all required session state variables"""
        if 'question_generator' not in st.session_state:
            st.session_state.question_generator = QuestionGenerator()
        if 'audio_generator' not in st.session_state:
            st.session_state.audio_generator = AudioGenerator()
        if 'current_question' not in st.session_state:
            st.session_state.current_question = None
        if 'feedback' not in st.session_state:
            st.session_state.feedback = None
        if 'current_practice_type' not in st.session_state:
            st.session_state.current_practice_type = None
        if 'current_topic' not in st.session_state:
            st.session_state.current_topic = None
        if 'current_audio' not in st.session_state:
            st.session_state.current_audio = None
    
    def render_sidebar(self):
        """Render the sidebar with saved questions"""
        stored_questions = self.question_manager.load_stored_questions()
        
        with st.sidebar:
            st.header("Saved Questions")
            if stored_questions:
                for qid, qdata in stored_questions.items():
                    button_label = f"{qdata['practice_type']} - {qdata['topic']}\n{qdata['created_at']}"
                    if st.button(button_label, key=qid):
                        st.session_state.current_question = qdata['question']
                        st.session_state.current_practice_type = qdata['practice_type']
                        st.session_state.current_topic = qdata['topic']
                        st.session_state.current_audio = qdata.get('audio_file')
                        st.session_state.feedback = None
                        st.rerun()
            else:
                st.info("No saved questions yet. Generate some questions to see them here!")
    
    def render_practice_controls(self):
        """Render practice type and topic selection controls"""
        practice_type = st.selectbox(
            "Select Practice Type",
            ["Dialogue Practice", "Phrase Matching"]
        )
        
        topics = {
            "Dialogue Practice": ["Daily Conversation", "Shopping", "Restaurant", "Travel", "School/Work"],
            "Phrase Matching": ["Announcements", "Instructions", "Weather Reports", "News Updates"]
        }
        
        topic = st.selectbox(
            "Select Topic",
            topics[practice_type]
        )
        
        if st.button("Generate New Question"):
            section_num = 2 if practice_type == "Dialogue Practice" else 3
            new_question = st.session_state.question_generator.generate_similar_question(
                section_num, topic
            )
            st.session_state.current_question = new_question
            st.session_state.current_practice_type = practice_type
            st.session_state.current_topic = topic
            st.session_state.feedback = None
            
            # Save the generated question
            self.question_manager.save_question(new_question, practice_type, topic)
            st.session_state.current_audio = None
    
    def render_question_content(self):
        """Render the current question content"""
        if not st.session_state.current_question:
            st.info("Click 'Generate New Question' to start practicing!")
            return
        
        st.subheader("Practice Scenario")
        
        # Display question components
        if st.session_state.current_practice_type == "Dialogue Practice":
            st.write("**Introduction:**")
            st.write(st.session_state.current_question['Introduction'])
            st.write("**Conversation:**")
            st.write(st.session_state.current_question['Conversation'])
        else:
            st.write("**Situation:**")
            st.write(st.session_state.current_question['Situation'])
        
        st.write("**Question:**")
        st.write(st.session_state.current_question['Question'])
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            self.render_answer_section()
        
        with col2:
            self.audio_manager.display_audio_section(
                st.session_state.audio_generator,
                st.session_state.current_question,
                st.session_state.current_practice_type,
                st.session_state.current_topic,
                self.question_manager.save_question
            )
    
    def render_answer_section(self):
        """Render the answer options and feedback"""
        options = st.session_state.current_question['Options']
        
        if st.session_state.feedback:
            correct = st.session_state.feedback.get('correct', False)
            correct_answer = st.session_state.feedback.get('correct_answer', 1) - 1
            selected_index = st.session_state.selected_answer - 1 if hasattr(st.session_state, 'selected_answer') else -1
            
            st.write("\n**Your Answer:**")
            for i, option in enumerate(options):
                if i == correct_answer and i == selected_index:
                    st.success(f"{i+1}. {option} ✓ (Correct!)")
                elif i == correct_answer:
                    st.success(f"{i+1}. {option} ✓ (This was the correct answer)")
                elif i == selected_index:
                    st.error(f"{i+1}. {option} ✗ (Your answer)")
                else:
                    st.write(f"{i+1}. {option}")
            
            st.write("\n**Explanation:**")
            explanation = st.session_state.feedback.get('explanation', 'No feedback available')
            if correct:
                st.success(explanation)
            else:
                st.error(explanation)
            
            if st.button("Try Another Question"):
                st.session_state.feedback = None
                st.rerun()
        else:
            selected = st.radio(
                "Choose your answer:",
                options,
                index=None,
                format_func=lambda x: f"{options.index(x) + 1}. {x}"
            )
            
            if selected and st.button("Submit Answer"):
                selected_index = options.index(selected) + 1
                st.session_state.selected_answer = selected_index
                st.session_state.feedback = st.session_state.question_generator.get_feedback(
                    st.session_state.current_question,
                    selected_index
                )
                st.rerun()
    
    def render_interactive_stage(self):
        """Main method to render the entire interactive learning stage"""
        self.initialize_session_state()
        self.render_sidebar()
        self.render_practice_controls()
        self.render_question_content()