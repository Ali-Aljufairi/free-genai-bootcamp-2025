# Sorami - Generative AI Project Collection

Welcome to the Sorami repository, a collection of interconnected Generative AI projects developed during the Free GenAI Bootcamp 2025. The central hub for many of these tools is the `lang-portal`.

## Projects

Here's a breakdown of the projects included:

### Agent
**[agent/](./agent/)**

An AI agent designed for enhanced internet searching and comparison tasks. It leverages graph-based processing and various APIs (including email/web integration) to provide comprehensive results. The agent can:
- Perform complex web searches and data aggregation
- Compare results from multiple sources
- Assist with language-related tasks
- Integrate with the ASL project for cross-modal language processing
- Send formatted email reports with search findings

---

### American Sign Language (ASL)
**[ASL/](./ASL/)**

Focuses on American Sign Language (ASL) recognition and learning. This project combines computer vision and machine learning to:
- Process and analyze sign language from images and videos
- Train and utilize machine learning classification models for gesture recognition
- Provide interactive learning tools for ASL alphabets and numbers
- Potentially integrate with the `agent` project for comprehensive language tasks

---

### GenAI Architecture
**[genai-architecting/](./genai-architecting/)**

Contains architectural diagrams and resources related to designing and building the Generative AI solutions within this repository. Includes:
- System architecture diagrams in Mermaid format
- Visual representations of component interactions
- Design patterns and best practices for GenAI applications
- Planning documents for future Sorami projects

---

### Kubernetes Deployment
**[k8s/](./k8s/)**

Holds Kubernetes deployment configurations for containerizing and orchestrating the various Sorami applications. Features:
- Standard deployment manifests for all microservices
- Resource allocation and scaling policies
- Service discovery and networking configurations
- Persistent storage solutions for stateful components

---

### Language Portal
**[lang-portal/](./lang-portal/)**

The central portal connecting many Sorami projects. This core application serves as the main user interface and:
- Features a Go backend for high-performance API handling
- Implements a Next.js frontend for responsive user interactions
- Provides a unified interface to access all Sorami tools
- Manages shared data resources (e.g., `words.db`)

---

### Listening Comprehension
**[listening-comp/](./listening-comp/)**

A listening comprehension tool, specifically geared towards JLPT preparation. This project:
- Implements Retrieval-Augmented Generation (RAG) to process audio transcripts
- Generates relevant questions based on audio content
- Provides difficulty-adjusted practice materials
- Tracks user progress through listening exercises
- Offers transcript search functionality for targeted practice

---

### Quiz Generator
**[quiz-gen/](./quiz-gen/)**

Generates practice questions, particularly for the JLPT and other language proficiency tests. The system:
- Utilizes LLM APIs to create contextually relevant quiz content
- Adapts question difficulty based on user performance
- Supports various question formats (multiple-choice, fill-in-blank, etc.)
- Saves question sets in structured JSON format for reuse
- Provides API endpoints for integration with other Sorami tools

---

### Sentence Constructor
**[sentence-constructor/](./sentence-constructor/)**

A tool aiding in Japanese sentence construction with support for multiple language learning scenarios. Features include:
- Support for multiple Large Language Models (ChatGPT, Claude, Gemini, Llama)
- Japanese speech capabilities for pronunciation practice
- Grammar pattern exercises and corrections
- Context-aware sentence generation
- Vocabulary usage demonstrations in proper context

---

### Speech Analysis
**[speach/](./speach/)**

Analyzes spoken Japanese to provide feedback on pronunciation, intonation, and fluency. The system:
- Processes audio input to detect speech patterns
- Compares user pronunciation with native speech models
- Highlights areas for improvement in pronunciation
- Offers targeted exercises for difficult sounds
- Tracks progress over time with detailed metrics

---

### Video Translation
**[video-translation/](./video-translation/)**

A tool for translating video content between languages, with special focus on educational materials. This project:
- Extracts audio from video files for processing
- Transcribes speech to text in the source language
- Translates content to target language
- Generates subtitles or dubbed audio
- Preserves timing and context across translations

---

### Vocabulary Importer
**[vocab-importer/](./vocab-importer/)**

Helps language learners efficiently import and manage vocabulary lists. This tool:
- Extracts vocabulary from various source formats (text, PDF, websites)
- Organizes words by frequency, JLPT level, or custom categories
- Generates example sentences for each vocabulary item
- Integrates with the central language portal database
- Provides API endpoints for vocabulary retrieval

---

### Writing Practice
**[writing-practice/](./writing-practice/)**

An interactive web application for practicing Japanese writing, featuring word and sentence exercises with real-time feedback. Key features include:
- Word practice mode with random vocabulary generation
- Sentence practice with AI-generated example sentences
- Handwriting input and OCR recognition
- AI-powered grading and feedback on writing accuracy
- Progress tracking across different writing exercises

## Getting Started

To begin exploring the Sorami project collection:

1. Clone this repository
2. Navigate to the specific project directory you're interested in
3. Follow the setup instructions in each project's individual README
4. Most projects can be run using Docker Compose with the provided configuration files

## Technologies

The Sorami project collection leverages several key technologies:
- Large Language Models (Various providers)
- Python with specialized AI and NLP libraries
- Go for high-performance backend services
- Next.js for interactive frontends
- Docker and Kubernetes for containerization
- PostgreSQL and SQLite for data storage
