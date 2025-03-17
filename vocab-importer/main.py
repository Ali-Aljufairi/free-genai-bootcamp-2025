from typing import List, Optional
import json
import os

import dotenv
from pydantic import BaseModel
from groq import Groq


dotenv.load_dotenv()
groq = Groq(api_key=os.environ["GROQ_API_KEY"])

class type (BaseModel):
    type: str
    
class Japanesewords(BaseModel):
    words: List["word"]


class word(BaseModel):
    japanese: str
    romanji: str
    english: str
    parts: type
    



def get_japanese(recipe_name: str) -> Japanesewords:
    chat_completion = groq.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a word database that outputs Japanese words in JSON and write Japense Kanji and what type of word is this.\n"
                # Pass the json schema to the model. Pretty printing improves results.
                f" The JSON object must use the schema: {json.dumps(Japanesewords.model_json_schema(), indent=2)}",
            },
            {
                "role": "user",
                "content": f"Fetch Japanese words for {recipe_name}",
            },
        ],
        model="qwen-2.5-32b",
        temperature=0,
        # Streaming is not supported in JSON mode
        stream=False,
        # Enable JSON mode by setting the response format
        response_format={"type": "json_object"},
    )
    return Japanesewords.model_validate_json(chat_completion.choices[0].message.content)



def save_recipe_to_json(Japenesewords: Japanesewords, filepath: Optional[str] = None):
    """
    Save a recipe to a JSON file.

    Args:
        recipe: Recipe object to save
        filepath: Path to save the file. If None, uses recipe_name.json
    """
    if filepath is None:
        # Create a filename based on the recipe name
        # Replace spaces with underscores and convert to lowercase for a clean filename
        filename = Japenesewords.words[0].japanese.lower().replace(" ", "_") + ".json"
        filepath = filename

    # Convert the recipe to a dictionary and then to JSON
    recipe_json = Japenesewords.model_dump_json(indent=2)

    with open(filepath, "w") as f:
        f.write(recipe_json)

    print(f"Recipe saved to {filepath}")



Japanesewords = get_japanese("sushi")

save_recipe_to_json(Japanesewords, "sushi.json")
