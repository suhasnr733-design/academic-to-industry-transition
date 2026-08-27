# backend/tests/conftest.py
"""Pytest configuration – ensures `backend/` is on sys.path so `from app import ...` works."""

import sys
import os

# Add backend directory and project root to path so `app` and `data_pipeline` packages are importable
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_root_dir = os.path.abspath(os.path.join(_backend_dir, '..'))

if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
if _root_dir not in sys.path:
    sys.path.insert(0, _root_dir)

