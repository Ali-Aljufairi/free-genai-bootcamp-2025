import os
import streamlit as st
import sys


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class AudioManager:
    def __init__(self):
        pass
    
    def handle_audio_generation(self, audio_generator, current_question, current_practice_type, current_topic, save_question):
        """Handle audio generation and display"""
        if st.button("Generate Audio"):
            with st.spinner("Generating audio..."):
                try:
                    # Clear any previous audio
                    if st.session_state.current_audio and os.path.exists(st.session_state.current_audio):
                        try:
                            os.unlink(st.session_state.current_audio)
                        except Exception:
                            pass
                    st.session_state.current_audio = None
                    
                    # Generate new audio
                    audio_file = audio_generator.generate_audio(current_question)
                    
                    # Verify the audio file exists
                    if not os.path.exists(audio_file):
                        raise Exception("Audio file was not created")
                        
                    st.session_state.current_audio = audio_file
                    
                    # Update stored question with audio file
                    save_question(
                        current_question,
                        current_practice_type,
                        current_topic,
                        audio_file
                    )
                    st.rerun()
                except Exception as e:
                    st.error(f"Error generating audio: {str(e)}")
                    # Clear the audio state on error
                    st.session_state.current_audio = None
    
    def display_audio_section(self, audio_generator, current_question, current_practice_type, current_topic, save_question):
        """Display the audio section of the UI"""
        st.subheader("Audio")
        if st.session_state.current_audio:
            # Display audio player
            st.audio(st.session_state.current_audio)
        elif current_question:
            # Show generate audio button
            self.handle_audio_generation(
                audio_generator,
                current_question,
                current_practice_type,
                current_topic,
                save_question
            )
        else:
            st.info("Generate a question to create audio.")