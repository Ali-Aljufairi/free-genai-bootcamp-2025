# components.py
import streamlit as st
from streamlit_drawable_canvas import st_canvas
import numpy as np


def draw_japanese_canvas(key: str):
    """
    Display a drawable canvas for users to draw Japanese characters.
    Returns the canvas image (numpy array) or None if empty.
    """
    # Initialize session state for canvas data if not exists
    if f"{key}_canvas_data" not in st.session_state:
        st.session_state[f"{key}_canvas_data"] = None

    col1, col2 = st.columns([4, 1])

    with col1:
        stroke_width = st.slider("Stroke width:", 1, 25, 3, key=f"{key}_stroke")

    with col2:
        if st.button("Clear Canvas", key=f"{key}_clear"):
            st.session_state[f"{key}_canvas_data"] = None
            st.session_state[f"{key}_cleared"] = True
            return None

    canvas_result = st_canvas(
        fill_color="rgba(255, 0, 0, 0.3)",  # Red fill color
        stroke_width=stroke_width,
        stroke_color="#FF0000",  # Red stroke color
        background_color="#0F1116",
        height=400,  # Larger height
        width=550,  # Larger width
        drawing_mode="freedraw",
        key=key
        if f"{key}_cleared" not in st.session_state
        else f"{key}_{np.random.randint(1000000)}",
    )

    # Check if canvas has any drawing
    if canvas_result.image_data is not None:
        # Check if the canvas has any non-background pixels
        if np.any(canvas_result.image_data < 254):  # Using 254 as threshold to detect drawings
            st.session_state[f"{key}_canvas_data"] = canvas_result.image_data
            return canvas_result.image_data

    return st.session_state.get(f"{key}_canvas_data")
