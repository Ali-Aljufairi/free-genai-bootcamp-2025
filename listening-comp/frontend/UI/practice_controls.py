import streamlit as st
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class PracticeControls:
    def __init__(self, question_manager):
        self.question_manager = question_manager

    def render(self):
        """Render practice type and topic selection controls"""
        practice_type = st.selectbox(
            "Select Practice Type", ["Dialogue Practice", "Phrase Matching"]
        )

        topics = {
            "Dialogue Practice": [
                "Daily Conversation",
                "Shopping",
                "Restaurant",
                "Travel",
                "School/Work",
            ],
            "Phrase Matching": [
                "Announcements",
                "Instructions",
                "Weather Reports",
                "News Updates",
            ],
        }

        topic = st.selectbox("Select Topic", topics[practice_type])

        if st.button("Generate New Question"):
            section_num = 2 if practice_type == "Dialogue Practice" else 3
            new_question = (
                st.session_state.question_generator.generate_similar_question(
                    section_num, topic
                )
            )
            st.session_state.current_question = new_question
            st.session_state.current_practice_type = practice_type
            st.session_state.current_topic = topic
            st.session_state.feedback = None

            # Save the generated question
            self.question_manager.save_question(new_question, practice_type, topic)
            st.session_state.current_audio = None
