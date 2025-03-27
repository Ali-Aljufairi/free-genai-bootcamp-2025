"""
Email node for ShopGenie.
"""
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from models.schemas import State, EmailRecommendation
from utils.email_templates import EMAIL_HTML_TEMPLATE, EMAIL_TEMPLATE_PROMPT
from utils.storage_utils import store_output
from config import llm
from utils.email_utils import send_email

def send_email_node(state: State):
    """
    Generate and send email with product recommendation.
    
    Args:
        state: The current state
        
    Returns:
        dict: Empty dict if email is sent successfully
    """
    if "best_product" in state and state['best_product']:
        # Extract necessary data from state
        user_query = state["query"]
        best_product_name = state["best_product"]["product_name"]
        justification = state["best_product"]["justification"]
        youtube_link = state["youtube_link"]
        recipient_email = state['email']
        
        # Setup parser for email content
        parser = JsonOutputParser(pydantic_object=EmailRecommendation)
        # Initialize the LLM
        prompt = PromptTemplate(
            template=EMAIL_TEMPLATE_PROMPT,
            input_variables=["product_name", "justification_line", "user_query"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        # Generate email content
        chain = prompt | llm | parser
        response = chain.invoke({
            "product_name": best_product_name, 
            "justification_line": justification, 
            "user_query": user_query
        })
        
        # Format HTML content
        html_content = EMAIL_HTML_TEMPLATE.format(
            product_name=best_product_name, 
            justification=response["justification_line"], 
            youtube_link=youtube_link,
            heading=response['heading']
        )
        
        # Store the email output before sending
        output_data = {
            "query": user_query,
            "email_recipient": recipient_email,
            "best_product": {
                "name": best_product_name,
                "justification": justification
            },
            "email_content": {
                "subject": response['subject'],
                "heading": response['heading'],
                "justification_line": response["justification_line"],
                "html_content": html_content
            },
            "youtube_link": youtube_link,
            "comparison_data": state.get("comparison", [])
        }
        
        # Store the output data
        stored_file_path = store_output(output_data, recipient_email, output_type="recommendation")
        
        # Send the email
        send_email(
            recipient_email,
            subject=response['subject'],
            body=html_content
        )
        
        return {"output_stored_at": stored_file_path}
    
    return None