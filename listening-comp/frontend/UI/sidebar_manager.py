import streamlit as st
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class SidebarManager:
    def __init__(self, question_manager):
        self.question_manager = question_manager

    def render(self):
        """Render the sidebar with saved questions grouped by practice type and topic"""
        stored_questions = self.question_manager.load_stored_questions()

        with st.sidebar:
            st.header("📚 Saved Questions")
            if stored_questions:
                # Group questions by practice type and topic
                grouped_questions = {}
                for qid, qdata in stored_questions.items():
                    practice_type = qdata["practice_type"]
                    topic = qdata["topic"]

                    if practice_type not in grouped_questions:
                        grouped_questions[practice_type] = {}

                    if topic not in grouped_questions[practice_type]:
                        grouped_questions[practice_type][topic] = []

                    grouped_questions[practice_type][topic].append((qid, qdata))

                # Display grouped questions with tabs and expanders
                practice_type_emojis = {
                    "Dialogue Practice": "💬",
                    "Phrase Matching": "🎯"
                }
                topic_emojis = {
                    "Daily Conversation": "💭",
                    "Shopping": "🛍️",
                    "Restaurant": "🍽️",
                    "Travel": "✈️",
                    "School/Work": "💼",
                    "Announcements": "📢",
                    "Instructions": "📝",
                    "Weather Reports": "🌤️",
                    "News Updates": "📰"
                }

                # Create tabs for practice types
                practice_types = list(grouped_questions.keys())
                if practice_types:
                    tabs = st.tabs([f"{practice_type_emojis.get(pt, '📝')} {pt}" for pt in practice_types])
                    
                    for tab, practice_type in zip(tabs, practice_types):
                        with tab:
                            topics = grouped_questions[practice_type]
                            for topic, questions in topics.items():
                                topic_emoji = topic_emojis.get(topic, "📌")
                                with st.expander(f"{topic_emoji} {topic}"):
                                    for qid, qdata in sorted(
                                        questions,
                                        key=lambda x: x[1]["created_at"],
                                        reverse=True,
                                    ):
                                        created_at = qdata["created_at"]
                                        date_str = "-".join(
                                            created_at.split()[0].split("-")[1:]
                                        )
                                        time_str = created_at.split()[1].split(".")[
                                            0
                                        ]  # Remove microseconds
                                        button_label = f"⏰ {date_str} {time_str}"

                                        if st.button(button_label, key=qid):
                                            st.session_state.current_question = qdata[
                                                "question"
                                            ]
                                            st.session_state.current_practice_type = qdata[
                                                "practice_type"
                                            ]
                                            st.session_state.current_topic = qdata["topic"]
                                            st.session_state.current_audio = qdata.get(
                                                "audio_file"
                                            )
                                            st.session_state.feedback = None
                                            st.rerun()
            else:
                st.info(
                    "No saved questions yet. Generate some questions to see them here!"
                )
