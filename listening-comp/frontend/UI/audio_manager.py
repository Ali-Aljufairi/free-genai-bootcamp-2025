import os
import sys
import streamlit as st

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class AudioManager:
    def __init__(self):
        pass
    
    def display_audio_section(self, audio_generator, current_question, current_practice_type, current_topic, save_question):
        """Display the audio section of the UI"""
        st.markdown("---")
        st.subheader("🎧 Audio Practice")
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            # Display current audio if available
            if st.session_state.current_audio and os.path.exists(st.session_state.current_audio):
                st.audio(st.session_state.current_audio)
            
            # Generate new audio button
            if st.button("Generate New Audio"):
                with st.spinner("Generating audio..."):
                    try:
                        # Use transcript-based audio generation if source segments exist
                        if "source_segments" in current_question:
                            audio_file = audio_generator.generate_audio_from_transcript(current_question)
                        else:
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
                        
                        st.success("New audio generated!")
                        st.experimental_rerun()
                        
                    except Exception as e:
                        st.error(f"Failed to generate audio: {str(e)}")
        
        with col2:
            if "source_segments" in current_question:
                st.write("📌 Includes original audio segments")
                if st.button("Regenerate with Different Voices"):
                    with st.spinner("Regenerating audio..."):
                        try:
                            audio_file = audio_generator.generate_audio_from_transcript(current_question)
                            st.session_state.current_audio = audio_file
                            st.experimental_rerun()
                        except Exception as e:
                            st.error(f"Failed to regenerate audio: {str(e)}")