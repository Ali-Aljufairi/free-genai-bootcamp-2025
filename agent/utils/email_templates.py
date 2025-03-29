"""
Email templates for ShopGenie application.
"""

EMAIL_HTML_TEMPLATE = """
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #1a1a2e;
                color: #eaeaea;
            }}
            .email-container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #16213e;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                overflow: hidden;
            }}
            .header {{
                background-color: #0f3460;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
            }}
            .content {{
                padding: 20px;
            }}
            .content h2 {{
                color: #eaeaea;
                font-size: 20px;
                margin-bottom: 10px;
            }}
            .content p {{
                color: #c4c4c4;
                font-size: 16px;
                line-height: 1.5;
            }}
            .button {{
                display: inline-block;
                margin-top: 20px;
                background-color: #0f3460;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }}
            .button:hover {{
                background-color: #1a73e8;
                color: #ffffff;
            }}
            .footer {{
                text-align: center;
                font-size: 14px;
                color: #999999;
                padding: 10px 20px;
            }}
            .footer a {{
                color: #ffffff;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>{heading}</h1>
            </div>
            <div class="content">
                <h2>Our Top Pick: {product_name}</h2>
                <p>{justification}</p>
                <p>Watch our in-depth review to explore why this phone is the best choice for you:</p>
                <a href="{youtube_link}" class="button" target="_blank" style="color: #ffffff;">Watch the Review</a>
            </div>
            <div class="footer">
                <p>
                    Want to learn more about how I did this? Please check my GitHub:
                    <a href="https://github.com/Ali-Aljufairi/">Ali Aljufairi</a>
                </p>
                <p>&copy; 2025 Ali Jufairi, All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

EMAIL_TEMPLATE_PROMPT = """
You are an expert email content writer.

Generate an email recommendation based on the following inputs:
- Product Name: {product_name}
- Justification Line: {justification_line}
- User Query: "{user_query}" (a general idea of the user's interest, such as "a smartphone for photography" or "a premium gaming laptop").

Return your output in the following JSON format:
{format_instructions}

### Input Example:
Product Name: Google Pixel 8 Pro
Justification Line: Praised for its exceptional camera, advanced AI capabilities, and vibrant display.
User Query: a phone with an amazing camera

### Example Output:
{{
  "subject": "Capture Every Moment with Google Pixel 8 Pro",
  "heading": "Discover the Power of the Ultimate Photography Smartphone",
  "justification_line": "Known for its exceptional camera quality, cutting-edge AI features, and vibrant display, the Google Pixel 8 Pro is perfect for photography enthusiasts."
}}

Now generate the email recommendation based on the inputs provided.
"""
