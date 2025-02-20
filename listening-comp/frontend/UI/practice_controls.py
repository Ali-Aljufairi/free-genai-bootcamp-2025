import streamlit as st
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class PracticeControls:
    def __init__(self, question_manager):
        self.question_manager = question_manager

    def render(self):
        """Render practice type and topic selection controls"""
        practice_types = {
            "💬 Dialogue Practice": "Dialogue Practice",
            "🎯 Phrase Matching": "Phrase Matching"
        }
        practice_type_display = st.selectbox(
            "Select Practice Type",
            list(practice_types.keys())
        )
        practice_type = practice_types[practice_type_display]

        topics = {
            "Dialogue Practice": {
                "💭 Daily Conversation": "Daily Conversation",
                "🛍️ Shopping": "Shopping",
                "🍽️ Restaurant": "Restaurant",
                "✈️ Travel": "Travel",
                "💼 School/Work": "School/Work"
            },
            "Phrase Matching": {
                "📢 Announcements": "Announcements",
                "📝 Instructions": "Instructions",
                "🌤️ Weather Reports": "Weather Reports",
                "📰 News Updates": "News Updates"
            }
        }

        topic_display = st.selectbox(
            "Select Topic",
            list(topics[practice_type].keys())
        )
        topic = topics[practice_type][topic_display]

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
