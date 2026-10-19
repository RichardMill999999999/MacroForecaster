"""Compatibility wrapper for the single Flask app.

Run this file or app.py; both start the same server instance.
"""
from app import app


if __name__ == "__main__":
    app.run()
