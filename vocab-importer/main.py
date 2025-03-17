from typing import List, Optional
import json
import os

import dotenv
from pydantic import BaseModel
from groq import Groq


dotenv.load_dotenv()
groq = Groq(api_key=os.environ["GROQ_API_KEY"])


# Data model for LLM to generate
class Ingredient(BaseModel):
    name: str
    quantity: str
    quantity_unit: Optional[str]


class Recipe(BaseModel):
    recipe_name: str
    ingredients: List[Ingredient]
    directions: List[str]


def get_recipe(recipe_name: str) -> Recipe:
    chat_completion = groq.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a recipe database that outputs recipes in JSON.\n"
                # Pass the json schema to the model. Pretty printing improves results.
                f" The JSON object must use the schema: {json.dumps(Recipe.model_json_schema(), indent=2)}",
            },
            {
                "role": "user",
                "content": f"Fetch a recipe for {recipe_name}",
            },
        ],
        model="llama3-70b-8192",
        temperature=0,
        # Streaming is not supported in JSON mode
        stream=False,
        # Enable JSON mode by setting the response format
        response_format={"type": "json_object"},
    )
    return Recipe.model_validate_json(chat_completion.choices[0].message.content)


def print_recipe(recipe: Recipe):
    print("Recipe:", recipe.recipe_name)

    print("\nIngredients:")
    for ingredient in recipe.ingredients:
        print(
            f"- {ingredient.name}: {ingredient.quantity} {ingredient.quantity_unit or ''}"
        )
    print("\nDirections:")
    for step, direction in enumerate(recipe.directions, start=1):
        print(f"{step}. {direction}")


def save_recipe_to_json(recipe: Recipe, filepath: str = None):
    """
    Save a recipe to a JSON file.

    Args:
        recipe: Recipe object to save
        filepath: Path to save the file. If None, uses recipe_name.json
    """
    if filepath is None:
        # Create a filename based on the recipe name
        # Replace spaces with underscores and convert to lowercase for a clean filename
        filename = recipe.recipe_name.lower().replace(" ", "_") + ".json"
        filepath = filename

    # Convert the recipe to a dictionary and then to JSON
    recipe_json = recipe.model_dump_json(indent=2)

    with open(filepath, "w") as f:
        f.write(recipe_json)

    print(f"Recipe saved to {filepath}")


# Get the recipe
recipe = get_recipe("apple pie")

# Print the recipe
print_recipe(recipe)

# Save the recipe to a JSON file
save_recipe_to_json(recipe)
