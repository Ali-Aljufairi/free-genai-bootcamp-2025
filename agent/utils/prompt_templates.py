"""
Prompt templates for ShopGenie application.
"""

# Product comparison prompt template
PRODUCT_COMPARISON_TEMPLATE = """
You are an AI assistant that compares products and provides a structured JSON output. Analyze the given product data and generate a detailed comparison using the following format:

### Instructions:
1. **Compare the products** provided in `{product_data}` based on key specifications, ratings, and user reviews.
2. **Select the best product** among them based on performance, ratings, and overall balance.
3. **Ensure JSON output** formatted exactly as shown in the example.

### JSON Output Format:
```
{{
  "comparisons": [
    {{
      "product_name": "Product A",
      "specs_comparison": {{
        "processor": "Processor model",
        "battery": "Battery capacity",
        "camera": "Camera details",
        "display": "Display specs",
        "storage": "Storage capacity"
      }},
      "ratings_comparison": {{
        "overall_rating": 4.5,
        "performance": 4.7,
        "battery_life": 4.3,
        "camera_quality": 4.6,
        "display_quality": 4.8
      }},
      "reviews_summary": "Brief review summary"
    }},
    {{
      "product_name": "Product B",
      "specs_comparison": {{
        "processor": "Processor model",
        "battery": "Battery capacity",
        "camera": "Camera details",
        "display": "Display specs",
        "storage": "Storage capacity"
      }},
      "ratings_comparison": {{
        "overall_rating": 4.6,
        "performance": 4.8,
        "battery_life": 4.1,
        "camera_quality": 4.5,
        "display_quality": 4.7
      }},
      "reviews_summary": "Brief review summary"
    }}
  ],
  "best_product": {{
    "product_name": "Best Product Name",
    "justification": "Reason for selection"
  }}
}}
```

**Your task:**
- Extract relevant data from `{product_data}` and structure it as per the JSON format.
- Ensure all fields are populated correctly.
- Always return a valid JSON response.
"""

# Schema mapping prompt template
SCHEMA_MAPPING_TEMPLATE = """
You are a professional assistant tasked with extracting structured information from blogs.

### Instructions:

1. **Product Details**: For each product mentioned in the blog post, extract structured data, including:
   - `title`: The product name.
   - `url`: Link to the blog post or relevant page.
   - `content`: A concise summary of the product's main features or purpose.
   - `pros`: A list of positive aspects or advantages of the product. If not available, extract from blog content.
   - `cons`: A list of negative aspects or disadvantages. If not available, extract from blog content.
   - `highlights`: A dictionary containing notable features or specifications. If not available, extract from blog content.
   - `score`: A numerical rating score if available; otherwise, use `0.0`.

### Example JSON Output Format:
```
{{
  "reviews": [
    {{
      "title": "iPhone 15 Pro Max",
      "url": "https://example.com/iphone15-review",
      "content": "Apple's flagship smartphone with A17 Pro chip and advanced camera system.",
      "pros": ["Excellent camera system", "Powerful A17 Pro processor", "Great battery life"],
      "cons": ["Expensive", "Limited customization options"],
      "highlights": {{
        "Camera": "48MP main sensor with 5x optical zoom",
        "Performance": "A17 Pro chip with 6-core CPU",
        "Display": "6.7-inch Super Retina XDR display"
      }},
      "score": 4.8
    }},
    {{
      "title": "Samsung Galaxy S23 Ultra",
      "url": "https://example.com/galaxy-s23-review",
      "content": "Samsung's premium smartphone with S Pen support and high-resolution cameras.",
      "pros": ["Versatile camera system", "S Pen functionality", "Excellent display"],
      "cons": ["High price", "Large and heavy"],
      "highlights": {{
        "Camera": "200MP main camera with 10x optical zoom",
        "Performance": "Snapdragon 8 Gen 2 processor",
        "Display": "6.8-inch Dynamic AMOLED 2X"
      }},
      "score": 4.7
    }}
  ]
}}
```

### Blogs Contents: {blogs_content}

{format_instructions}

Ensure your response follows this exact schema without any additional text or explanation. Your response must be a valid JSON object containing the "reviews" array with at least 2 smartphone reviews.
"""

# Product comparison detailed prompt template
PRODUCT_COMPARISON_DETAILED_TEMPLATE = """
You are a professional assistant tasked with comparing smartphone products and selecting the best option.

### Instructions:

1. **List of Products for Comparison (`comparisons`):**
   - Each product should include:
     - **Product Name**: The name of the product (e.g., "Smartphone A").
     - **Specs Comparison**:
       - **Processor**: Type and model of the processor (e.g., "Snapdragon 888").
       - **Battery**: Battery capacity and type (e.g., "4500mAh").
       - **Camera**: Camera specifications (e.g., "108MP primary").
       - **Display**: Display type, size, and refresh rate (e.g., "6.5 inch OLED, 120Hz").
       - **Storage**: Storage options and whether it is expandable (e.g., "128GB, expandable").
     - **Ratings Comparison**:
       - **Overall Rating**: Overall rating out of 5 (e.g., 4.5).
       - **Performance**: Rating for performance out of 5 (e.g., 4.7).
       - **Battery Life**: Rating for battery life out of 5 (e.g., 4.3).
       - **Camera Quality**: Rating for camera quality out of 5 (e.g., 4.6).
       - **Display Quality**: Rating for display quality out of 5 (e.g., 4.8).
     - **Reviews Summary**: Summary of key points from user reviews that highlight the strengths and weaknesses of this product.

2. **Best Product Selection (`best_product`):**
   - **Product Name**: Select the best product among the compared items.
   - **Justification**: Provide a brief explanation of why this product is considered the best choice. This should be based on factors such as balanced performance, high user ratings, advanced specifications, or unique features.

### Example JSON Output Format:
```
{{
  "comparisons": [
    {{
      "product_name": "iPhone 15 Pro Max",
      "specs_comparison": {{
        "processor": "A17 Pro chip",
        "battery": "4422mAh",
        "camera": "48MP primary with 5x optical zoom",
        "display": "6.7-inch Super Retina XDR, 120Hz",
        "storage": "256GB, not expandable"
      }},
      "ratings_comparison": {{
        "overall_rating": 4.8,
        "performance": 4.9,
        "battery_life": 4.7,
        "camera_quality": 4.9,
        "display_quality": 4.8
      }},
      "reviews_summary": "Users praise the exceptional camera quality and performance, but some note the high price and lack of expandable storage."
    }},
    {{
      "product_name": "Samsung Galaxy S23 Ultra",
      "specs_comparison": {{
        "processor": "Snapdragon 8 Gen 2",
        "battery": "5000mAh",
        "camera": "200MP primary with 10x optical zoom",
        "display": "6.8-inch Dynamic AMOLED 2X, 120Hz",
        "storage": "512GB, not expandable"
      }},
      "ratings_comparison": {{
        "overall_rating": 4.7,
        "performance": 4.8,
        "battery_life": 4.6,
        "camera_quality": 4.8,
        "display_quality": 4.9
      }},
      "reviews_summary": "Reviewers highlight the versatile camera system and excellent display, but mention the device is large and heavy."
    }}
  ],
  "best_product": {{
    "product_name": "iPhone 15 Pro Max",
    "justification": "The iPhone 15 Pro Max offers a better balance of performance, battery life, and camera quality with its A17 Pro chip and optimized software experience."
  }}
}}
```

{format_instructions}

Here is the product data to analyze:
{product_data}

Your response must be a valid JSON object following the specified format above, with no additional text or explanation.
"""
