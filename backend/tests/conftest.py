# backend/tests/conftest.py
"""Pytest configuration – ensures `backend/` is on sys.path so `from app import ...` works."""

import sys
import os

# Add backend directory to path so `app` package is importable
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
