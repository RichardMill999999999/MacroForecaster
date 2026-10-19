# config.py
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY2")
