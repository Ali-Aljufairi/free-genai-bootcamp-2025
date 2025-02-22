import chromadb
from chromadb.utils import embedding_functions
from chromadb.errors import InvalidCollectionException
import json
import os
import boto3
from typing import Dict, List, Optional
from backend.utils.logger import Logger

class BedrockEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, model_id="amazon.titan-embed-text-v2:0"):
        """Initialize Bedrock embedding function"""
        self.bedrock_client = boto3.client('bedrock-runtime', region_name="us-east-1")
        self.model_id = model_id
        self.logger = Logger().get_logger()
        self.dimension = 1024  # Titan v2 uses 1024 dimensions

    def __call__(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts using Bedrock"""
        embeddings = []
        for text in texts:
            try:
                # Log the text being embedded (truncated for readability)
                preview = text[:100] + "..." if len(text) > 100 else text
                self.logger.info(f"Generating embedding for text: {preview}")
                self.logger.debug(f"Full text length: {len(text)}")
                
                response = self.bedrock_client.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps({
                        "inputText": text
                    })
                )
                response_body = json.loads(response['body'].read())
                self.logger.debug(f"Embedding response keys: {response_body.keys()}")
                embedding = response_body['embedding']
                embeddings.append(embedding)
                self.logger.info(f"Successfully generated embedding of dimension {len(embedding)}")
            except Exception as e:
                self.logger.error(f"Error generating embedding: {str(e)}")
                # Return a zero vector as fallback with correct dimension
                embeddings.append([0.0] * self.dimension)
        return embeddings

class QuestionVectorStore:
    def __init__(self, persist_directory: str = "backend/data/vectorstore"):
        """Initialize the vector store for JLPT listening questions"""
        self.persist_directory = persist_directory
        self.logger = Logger().get_logger()
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Initialize Bedrock client
        self.bedrock_client = boto3.client('bedrock-runtime', region_name="us-east-1")
        
        # Use Bedrock's Titan embedding model
        self.embedding_fn = BedrockEmbeddingFunction()
        
        # Create or get collections
        self.collections = {}
        collection_configs = {
            "section2": {
                "name": "section2_questions",
                "metadata": {"description": "JLPT listening comprehension questions - Section 2"}
            },
            "section3": {
                "name": "section3_questions",
                "metadata": {"description": "JLPT phrase matching questions - Section 3"}
            },
            "transcripts": {
                "name": "transcripts",
                "metadata": {"description": "JLPT listening transcripts"}
            }
        }
        
        for key, config in collection_configs.items():
            try:
                # Try to get existing collection first
                self.collections[key] = self.client.get_collection(
                    name=config["name"]
                )
                # Update embedding function for existing collection
                self.collections[key]._embedding_function = self.embedding_fn
                self.logger.info(f"Retrieved existing collection: {config['name']}")
            except InvalidCollectionException:
                # Collection doesn't exist, create new one
                self.collections[key] = self.client.create_collection(
                    name=config["name"],
                    embedding_function=self.embedding_fn,
                    metadata=config["metadata"]
                )
                self.logger.info(f"Created new collection: {config['name']}")

    def add_questions(self, section_num: int, questions: List[Dict], video_id: str):
        """Add questions to the vector store"""
        if section_num not in [2, 3]:
            raise ValueError("Only sections 2 and 3 are currently supported")
            
        collection = self.collections[f"section{section_num}"]
        
        ids = []
        documents = []
        metadatas = []
        
        for idx, question in enumerate(questions):
            # Create a unique ID for each question
            question_id = f"{video_id}_{section_num}_{idx}"
            ids.append(question_id)
            
            # Store the full question structure as metadata
            metadatas.append({
                "video_id": video_id,
                "section": section_num,
                "question_index": idx,
                "full_structure": json.dumps(question)
            })
            
            # Create a searchable document from the question content
            if section_num == 2:
                document = f"""
                Situation: {question['Introduction']}
                Dialogue: {question['Conversation']}
                Question: {question['Question']}
                """
            else:  # section 3
                document = f"""
                Situation: {question['Situation']}
                Question: {question['Question']}
                """
            documents.append(document)
        
        # Add to collection
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

    def search_similar_questions(
        self, 
        section_num: int, 
        query: str, 
        n_results: int = 5
    ) -> List[Dict]:
        """Search for similar questions in the vector store"""
        if section_num not in [2, 3]:
            raise ValueError("Only sections 2 and 3 are currently supported")
            
        collection = self.collections[f"section{section_num}"]
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        # Convert results to more usable format
        questions = []
        for idx, metadata in enumerate(results['metadatas'][0]):
            question_data = json.loads(metadata['full_structure'])
            question_data['similarity_score'] = results['distances'][0][idx]
            questions.append(question_data)
            
        return questions

    def get_question_by_id(self, section_num: int, question_id: str) -> Optional[Dict]:
        """Retrieve a specific question by its ID"""
        if section_num not in [2, 3]:
            raise ValueError("Only sections 2 and 3 are currently supported")
            
        collection = self.collections[f"section{section_num}"]
        
        result = collection.get(
            ids=[question_id],
            include=['metadatas']
        )
        
        if result['metadatas']:
            return json.loads(result['metadatas'][0]['full_structure'])
        return None

    def parse_questions_from_file(self, filename: str) -> List[Dict]:
        """Parse questions from a structured text file"""
        questions = []
        current_question = {}
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                
                if line.startswith('<question>'):
                    current_question = {}
                elif line.startswith('Introduction:'):
                    i += 1
                    if i < len(lines):
                        current_question['Introduction'] = lines[i].strip()
                elif line.startswith('Conversation:'):
                    i += 1
                    if i < len(lines):
                        current_question['Conversation'] = lines[i].strip()
                elif line.startswith('Situation:'):
                    i += 1
                    if i < len(lines):
                        current_question['Situation'] = lines[i].strip()
                elif line.startswith('Question:'):
                    i += 1
                    if i < len(lines):
                        current_question['Question'] = lines[i].strip()
                elif line.startswith('Options:'):
                    options = []
                    for _ in range(4):
                        i += 1
                        if i < len(lines):
                            option = lines[i].strip()
                            if option.startswith('1.') or option.startswith('2.') or option.startswith('3.') or option.startswith('4.'):
                                options.append(option[2:].strip())
                    current_question['Options'] = options
                elif line.startswith('</question>'):
                    if current_question:
                        questions.append(current_question)
                        current_question = {}
                i += 1
            return questions
        except Exception as e:
            self.logger.error(f"Error parsing questions from {filename}: {str(e)}")
            return []

    def index_questions_file(self, filename: str, section_num: int):
        """Index all questions from a file into the vector store"""
        # Extract video ID from filename
        video_id = os.path.basename(filename).split('_section')[0]
        
        # Parse questions from file
        questions = self.parse_questions_from_file(filename)
        
        # Add to vector store
        if questions:
            self.add_questions(section_num, questions, video_id)
            self.logger.info(f"Indexed {len(questions)} questions from {filename}")

    def add_transcript(self, video_id: str, transcript_data: List[Dict], metadata: Dict = None):
        """Add transcript segments to the vector store
        
        Args:
            video_id (str): YouTube video ID
            transcript_data (List[Dict]): List of transcript segments with text and timing
            metadata (Dict): Additional metadata to store with segments
        """
        try:
            # Process transcript segments in chunks
            chunks = []
            current_chunk = []
            current_word_count = 0
            
            self.logger.info(f"Processing transcript with {len(transcript_data)} segments")
            
            for segment in transcript_data:
                # Get word count of current segment
                text = segment['text'].strip()  # Normalize text by stripping whitespace
                word_count = len(text.split())
                
                if current_word_count + word_count > 100:  # Chunk size of ~100 words
                    if current_chunk:
                        chunks.append(current_chunk)
                        current_chunk = []
                        current_word_count = 0
                
                current_chunk.append({'text': text, 'start': segment['start'], 'duration': segment['duration']})
                current_word_count += word_count
            
            # Add remaining chunk if any
            if current_chunk:
                chunks.append(current_chunk)
            
            self.logger.info(f"Created {len(chunks)} chunks from transcript")
            
            # Process each chunk
            for i, chunk in enumerate(chunks):
                # Combine text from segments in chunk
                text = " ".join(seg['text'] for seg in chunk)
                self.logger.debug(f"Chunk {i+1} text: {text[:100]}...")
                
                # Get timing info
                start_time = chunk[0]['start']
                end_time = chunk[-1]['start'] + chunk[-1]['duration']
                
                # Prepare metadata
                chunk_metadata = {
                    "video_id": video_id,
                    "start_time": start_time,
                    "end_time": end_time,
                    "chunk_index": i
                }
                if metadata:
                    chunk_metadata.update(metadata)
                
                # Add to transcripts collection instead of section2
                self.collections['transcripts'].add(
                    documents=[text],
                    metadatas=[chunk_metadata],
                    ids=[f"{video_id}_chunk_{i}"]
                )
                
                self.logger.info(f"Added chunk {i+1}/{len(chunks)} to vector store")
            
            self.logger.info(f"Successfully processed all transcript chunks")
            
        except Exception as e:
            self.logger.error(f"Error adding transcript to vector store: {str(e)}", exc_info=True)
            raise

    def search_transcripts(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for relevant transcript segments
        
        Args:
            query (str): Search query
            n_results (int): Number of results to return
            
        Returns:
            List[Dict]: List of relevant transcript segments with metadata
        """
        try:
            # Get the transcripts collection
            collection = self.collections['transcripts']
            
            # Normalize query by stripping whitespace
            query = query.strip()
            
            results = collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            formatted_results = []
            for i in range(len(results['ids'][0])):
                result = {
                    'id': results['ids'][0][i],
                    'text': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i] if 'distances' in results else None
                }
                formatted_results.append(result)
                
            return formatted_results
        except Exception as e:
            self.logger.error(f"Error searching transcripts: {str(e)}", exc_info=True)
            return []

    def generate_question_from_transcript(self, query: str, n_results: int = 3) -> Dict:
        """Generate a listening question from relevant transcript segments
        
        Args:
            query (str): Topic or theme to search for
            n_results (int): Number of transcript segments to consider
            
        Returns:
            Dict: Generated question with audio generation metadata
        """
        # Search for relevant transcript segments
        self.logger.info(f"Searching for transcript segments related to: {query}")
        segments = self.search_transcripts(query, n_results)
        if not segments:
            self.logger.error("No relevant transcript segments found")
            raise ValueError("No relevant transcript segments found")
            
        # Combine relevant segments into context
        context = "\n".join([seg['text'] for seg in segments])
        self.logger.debug(f"Combined context: {context}")
        
        # Use Bedrock to generate a structured question
        max_retries = 3
        for attempt in range(max_retries):
            try:
                self.logger.info(f"Generating question using Titan model (attempt {attempt + 1}/{max_retries})")
                response = self.bedrock_client.invoke_model(
                    modelId="amazon.titan-text-express-v1",
                    body=json.dumps({
                        "inputText": f"""You are a JLPT question generator. Your task is to create a listening practice question based on this Japanese transcript segment:

{context}

Output ONLY a valid JSON object in this EXACT format, with NO additional text or explanation:

{{
    "Introduction": "Brief context setting",
    "Conversation": "Natural dialogue based on the transcript",
    "Question": "Clear question about the dialogue",
    "Options": ["A", "B", "C", "D"],
    "CorrectAnswer": "The correct option letter",
    "Explanation": "Why this is the correct answer"
}}""",
                        "textGenerationConfig": {
                            "maxTokenCount": 1000,
                            "temperature": 0.7 - (attempt * 0.2),  # Reduce temperature with each retry
                            "topP": 0.9 - (attempt * 0.1)  # Reduce topP with each retry
                        }
                    })
                )
                response_body = json.loads(response['body'].read())
                self.logger.debug(f"Model response: {response_body}")
                
                # Extract and clean the JSON from the response
                output_text = response_body['results'][0]['outputText'].strip()
                self.logger.debug(f"Generated text: {output_text}")
                
                # Try to find JSON object if there's extra text
                if not output_text.startswith('{'):
                    import re
                    json_match = re.search(r'\{.*\}', output_text, re.DOTALL)
                    if json_match:
                        output_text = json_match.group(0)
                
                # Parse the JSON response
                question_data = json.loads(output_text)
                
                # Validate required fields
                required_fields = ['Introduction', 'Conversation', 'Question', 'Options', 'CorrectAnswer', 'Explanation']
                missing_fields = [field for field in required_fields if field not in question_data]
                if missing_fields:
                    raise ValueError(f"Missing required fields: {missing_fields}")
                
                if not isinstance(question_data['Options'], list) or len(question_data['Options']) != 4:
                    raise ValueError("Options must be a list of exactly 4 items")
                
                self.logger.info("Successfully parsed question data")
                
                # Add metadata for audio generation
                question_data.update({
                    "practice_type": "Dialogue Practice",
                    "topic": query,
                    "source_segments": [
                        {
                            "video_id": seg['metadata']['video_id'],
                            "start_time": seg['metadata']['start_time'],
                            "end_time": seg['metadata']['end_time']
                        }
                        for seg in segments
                    ]
                })
                
                return question_data
                
            except json.JSONDecodeError as e:
                self.logger.warning(f"Failed to parse JSON (attempt {attempt + 1}): {str(e)}")
                if attempt == max_retries - 1:
                    raise ValueError("Failed to generate valid JSON after all retries")
            except Exception as e:
                self.logger.error(f"Error generating question: {str(e)}", exc_info=True)
                if attempt == max_retries - 1:
                    raise

if __name__ == "__main__":
    # Example usage
    store = QuestionVectorStore()
    
    # Index questions from files
    question_files = [
        ("backend/data/questions/sY7L5cfCWno_section2.txt", 2),
        ("backend/data/questions/sY7L5cfCWno_section3.txt", 3)
    ]
    
    for filename, section_num in question_files:
        if os.path.exists(filename):
            store.index_questions_file(filename, section_num)
    
    # Search for similar questions
    similar = store.search_similar_questions(2, "誕生日について質問", n_results=1)
