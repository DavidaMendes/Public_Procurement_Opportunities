from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URI = os.getenv("DATABASE_URI")

try:
    client = MongoClient(DATABASE_URI, server_api=ServerApi('1'))
except Exception as e:
    print(f"Database connection error: {e}")

