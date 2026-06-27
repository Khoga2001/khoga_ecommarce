"""
Database dependency — module-level singleton
"""
from motor.motor_asyncio import AsyncIOMotorDatabase

# Will be set by server.py at startup
_db: AsyncIOMotorDatabase = None


def set_db(database: AsyncIOMotorDatabase):
    global _db
    _db = database


def get_db() -> AsyncIOMotorDatabase:
    return _db
