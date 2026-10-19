# config.py
import os
import openai

from dotenv import load_dotenv

load_dotenv()
from config import API_KEY

openai.api_key = API_KEY

if API_KEY is None:
    raise ValueError("API key not found in environment variables")

# gpt4_request.py

def get_gpt4_response(messages, model="gpt-4-turbo"):
    try:
        client = openai.OpenAI()
        response = client.ChatCompletion.create(
            model=model,
            messages=messages,
            temperature=1,
            max_tokens=256,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me a joke."}
    ]
    response = get_gpt4_response(messages)
    print(response)
