# backend/app/extensions.py

from app import db, bcrypt, jwt, migrate, cors, limiter

redis_client = None

__all__ = ['db', 'bcrypt', 'jwt', 'migrate', 'cors', 'limiter', 'redis_client']
