import streamlit as st
from ui_manager import UIManager

# Page config
st.set_page_config(
    page_title="JLPT Listening Practice",
    page_icon="🎧",
    layout="wide"
)

def main():
    st.title("JLPT Listening Practice")
    ui_manager = UIManager()
    ui_manager.render_interactive_stage()

if __name__ == "__main__":
    main()
