import streamlit as st
import os
import sys
from .youtube_transcript_manager import YouTubeTranscriptManager
from backend.get_transcript import get_transcript

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class SidebarManager:
    def __init__(self, question_manager):
        self.question_manager = question_manager
        self.youtube_transcript_manager = YouTubeTranscriptManager(st.session_state.youtube_service)

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

            # YouTube Transcript Section
            st.header("YouTube Transcript")
            youtube_url = st.text_input("Enter YouTube URL", key="youtube_url")
            
            if st.button("Get and Save Transcript"):
                if youtube_url:
                    with st.spinner("Fetching transcript..."):
                        video_id = st.session_state.youtube_service.extract_video_id(youtube_url)
                        if video_id:
                            transcript = get_transcript(youtube_url)
                            if transcript:
                                if self.youtube_transcript_manager.save_transcript(youtube_url, transcript):
                                    st.success("Transcript saved successfully!")
                                else:
                                    st.error("Failed to save transcript")
                            else:
                                st.error("Could not fetch transcript")
                        else:
                            st.error("Invalid YouTube URL")

            # Display saved transcripts
            st.subheader("Saved Transcripts")
            saved_transcripts = self.youtube_transcript_manager.get_saved_transcripts()
            if saved_transcripts:
                selected_transcript = st.selectbox(
                    "Select a saved transcript",
                    saved_transcripts
                )
                if selected_transcript:
                    transcript_data = self.youtube_transcript_manager.load_transcript(selected_transcript)
                    if transcript_data:
                        if st.button("Load Transcript"):
                            st.session_state.current_transcript = transcript_data
                            st.success("Transcript loaded!")
            else:
                st.info("No saved transcripts found")
