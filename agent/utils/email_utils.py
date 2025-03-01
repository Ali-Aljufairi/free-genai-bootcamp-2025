"""
Utility functions for sending emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import SMTP_SERVER, SMTP_PORT, GMAIL_USER, GMAIL_PASSWORD

def send_email(recipient_email, subject, body):
    """
    Send an email using SMTP.
    
    Args:
        recipient_email (str): The recipient's email address
        subject (str): The email subject
        body (str): The HTML body content of the email
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Create email content
        message = MIMEMultipart()
        message['From'] = GMAIL_USER
        message['To'] = recipient_email
        message['Subject'] = subject

        # Add the email body
        message.attach(MIMEText(body, 'html'))

        # Connect to the SMTP server
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Start TLS encryption
            server.login(GMAIL_USER, GMAIL_PASSWORD)  # Login to the server
            server.send_message(message)  # Send the email
            print(f"Email sent successfully to {recipient_email}.")
            return True

    except Exception as e:
        print(f"Failed to send email: {e}")
        return False