import streamlit as st
from .audio_manager import AudioManager


class QuestionContent:
    def __init__(self, question_manager):
        self.question_manager = question_manager
        self.audio_manager = AudioManager()

    def render(self):
        if not st.session_state.current_question:
            st.info("Click 'Generate New Question' to start practicing!")
            return

        st.subheader("Practice Scenario")

        if st.session_state.current_practice_type == "Dialogue Practice":
            st.write("**Introduction:**")
            st.write(st.session_state.current_question["Introduction"])
            st.write("**Conversation:**")
            st.write(st.session_state.current_question["Conversation"])
        else:
            st.write("**Situation:**")
            st.write(st.session_state.current_question["Situation"])

        st.write("**Question:**")
        st.write(st.session_state.current_question["Question"])

        # Display audio section
        self.audio_manager.display_audio_section(
            st.session_state.audio_generator,
            st.session_state.current_question,
            st.session_state.current_practice_type,
            st.session_state.current_topic,
            self.question_manager.save_question
        )

        self.render_answer_section()

    def render_answer_section(self):
        options = st.session_state.current_question["Options"]

        if st.session_state.feedback:
            correct = st.session_state.feedback.get("correct", False)
            correct_answer = st.session_state.feedback.get("correct_answer", 1) - 1
            selected_index = (
                st.session_state.selected_answer - 1
                if hasattr(st.session_state, "selected_answer")
                else -1
            )

            st.write("\n**Your Answer:**")
            for i, option in enumerate(options):
                if i == correct_answer and i == selected_index:
                    st.success(f"{i + 1}. {option} ✓ (Correct!)")
                elif i == correct_answer:
                    st.success(f"{i + 1}. {option} ✓ (This was the correct answer)")
                elif i == selected_index:
                    st.error(f"{i + 1}. {option} ✗ (Your answer)")
                else:
                    st.write(f"{i + 1}. {option}")

            st.write("\n**Explanation:**")
            explanation = st.session_state.feedback.get(
                "explanation", "No feedback available"
            )
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
                format_func=lambda x: f"{options.index(x) + 1}. {x}",
            )

            if selected and st.button("Submit Answer"):
                selected_index = options.index(selected) + 1
                st.session_state.selected_answer = selected_index
                st.session_state.feedback = (
                    st.session_state.question_generator.get_feedback(
                        st.session_state.current_question, selected_index
                    )
                )
                st.rerun()
