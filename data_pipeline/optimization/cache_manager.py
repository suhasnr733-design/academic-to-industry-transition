# data_pipeline/optimization/cache_manager.py

from datetime import datetime, timedelta
import logging
import threading
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class CacheManager:
    """Thread-safe, in-memory key-value cache with TTL support and statistics."""

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache by key if not expired.

        Args:
            key (str): Cache key.

        Returns:
            Any | None: Cached value if hit and valid, else None.
        """
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                self._misses += 1
                return None

            expiry = entry.get("expiry")
            if expiry and datetime.now() > expiry:
                del self._cache[key]
                self._misses += 1
                return None

            self._hits += 1
            return entry.get("value")

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """
        Store value in cache with specified TTL in seconds.

        Args:
            key (str): Cache key.
            value (Any): Value to store.
            ttl_seconds (int): Expiry duration in seconds.
        """
        with self._lock:
            expiry = datetime.now() + timedelta(seconds=ttl_seconds) if ttl_seconds > 0 else None
            self._cache[key] = {
                "value": value,
                "expiry": expiry,
                "created_at": datetime.now().isoformat()
            }

    def delete(self, key: str) -> bool:
        """
        Delete key from cache.

        Args:
            key (str): Cache key.

        Returns:
            bool: True if key was deleted, False if key was not found.
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cached entries."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """
        Get current cache statistics.

        Returns:
            dict: Cache stats including hits, misses, hit rate, and total items.
        """
        with self._lock:
            total_reqs = self._hits + self._misses
            hit_rate = float((self._hits / total_reqs) * 100.0) if total_reqs > 0 else 0.0
            return {
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(hit_rate, 2),
                "total_items": len(self._cache),
                "keys": list(self._cache.keys())
            }


cache_manager = CacheManager()
