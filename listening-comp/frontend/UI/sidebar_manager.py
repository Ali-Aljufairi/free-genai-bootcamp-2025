import streamlit as st
import os
import sys
from .youtube_transcript_manager import YouTubeTranscriptManager
from backend.get_transcript import get_transcript

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class SidebarManager:
    def __init__(self, question_manager):
        self.question_manager = question_manager
        self.youtube_transcript_manager = YouTubeTranscriptManager(
            st.session_state.youtube_service
        )

    def render(self):
        """Render the sidebar with saved questions grouped by practice type and topic"""
        stored_questions = self.question_manager.load_stored_questions()

        with st.sidebar:
            st.header("📚 Saved Questions")
            if not stored_questions:
                st.info(
                    "No saved questions yet. Generate some questions to see them here!"
                )
                return

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

            # Add custom CSS for bigger emojis and spacing
            st.markdown(
                """
                <style>
                    .stTabs [data-baseweb="tab-list"] {
                        gap: 24px;
                        justify-content: space-evenly;
                        width: 100%;
                    }
                    .stTabs [data-baseweb="tab"] {
                        font-size: 3rem !important;
                        padding: 15px;
                        flex: 1;
                        text-align: center;
                    }
                    .stTabs [data-baseweb="tab"]:hover {
                        transform: scale(1.1);
                        transition: transform 0.2s;
                    }
                </style>""",
                unsafe_allow_html=True,
            )

            # Create tabs for practice types and YouTube transcripts
            practice_type_emojis = {"Dialogue Practice": "💬", "Phrase Matching": "🎯"}
            topic_emojis = {
                "Daily Conversation": "💭",
                "Shopping": "🛍️",
                "Restaurant": "🍽️",
                "Travel": "✈️",
                "School/Work": "💼",
                "Announcements": "📢",
                "Instructions": "📝",
                "Weather Reports": "🌤️",
                "News Updates": "📰",
            }

            practice_types = list(grouped_questions.keys())
            all_tabs = practice_types + ["📺 YouTube Transcripts"]
            # Create tabs with emojis only and added spaces
            tabs = st.tabs(
                [f" {practice_type_emojis.get(pt, '📺')} " for pt in all_tabs]
            )

            # Handle all tabs
            for tab_idx, tab_type in enumerate(all_tabs):
                with tabs[tab_idx]:
                    if tab_type == "📺 YouTube Transcripts":
                        # YouTube Transcripts tab content
                        youtube_url = st.text_input(
                            "Enter YouTube URL", key="youtube_url"
                        )
                        col1, col2 = st.columns(2)
                        with col1:
                            n_level = st.selectbox(
                                "Select N-Level",
                                self.youtube_transcript_manager.n_levels,
                            )
                        with col2:
                            video_title = st.text_input("Video Title (Optional)")

                        if st.button("Get and Save Transcript"):
                            if youtube_url:
                                with st.spinner("Fetching transcript..."):
                                    video_id = st.session_state.youtube_service.extract_video_id(
                                        youtube_url
                                    )
                                    if video_id:
                                        transcript = get_transcript(youtube_url)
                                        if transcript:
                                            if self.youtube_transcript_manager.save_transcript(
                                                youtube_url,
                                                transcript,
                                                n_level,
                                                video_title,
                                            ):
                                                st.success(
                                                    "Transcript saved successfully!"
                                                )
                                            else:
                                                st.error("Failed to save transcript")
                                        else:
                                            st.error("Could not fetch transcript")
                                    else:
                                        st.error("Invalid YouTube URL")

                        # Display saved transcripts grouped by N-level
                        st.subheader("Saved Transcripts")
                        saved_transcripts = (
                            self.youtube_transcript_manager.get_saved_transcripts()
                        )

                        for level in self.youtube_transcript_manager.n_levels:
                            if saved_transcripts[level]:
                                with st.expander(f"🎯 JLPT {level}"):
                                    for transcript in saved_transcripts[level]:
                                        if st.button(
                                            f"📝 {transcript['title']}",
                                            key=f"transcript_{transcript['video_id']}",
                                        ):
                                            transcript_data = self.youtube_transcript_manager.load_transcript(
                                                transcript["video_id"]
                                            )
                                            if transcript_data:
                                                st.session_state.current_transcript = (
                                                    transcript_data["transcript"]
                                                )
                                                st.success("Transcript loaded!")
                                                st.rerun()
                    else:
                        # Practice type tab content
                        topics = grouped_questions[tab_type]
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

                                    if st.button(button_label, key=f"question_{qid}"):
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
