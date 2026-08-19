# data_pipeline/streaming/stream_processor.py

import asyncio
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Dict, Any, List, Callable
from collections import deque
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class StreamProcessor:
    """Streaming Data Processor powered by ThreadPoolExecutor"""

    def __init__(self, num_workers: int = 4):
        self.num_workers = num_workers
        self.executor = None
        self.is_running = False
        self.processors = {}
        self._thread = None
        self._stop_event = threading.Event()

    def add_processor(self, name_or_func, processor_func=None):
        """Add a custom processor function"""
        if processor_func is None:
            name = getattr(name_or_func, '__name__', str(name_or_func))
            func = name_or_func
        else:
            name = str(name_or_func)
            func = processor_func
        self.processors[name] = func

    def start(self):
        """Start thread pool executor and background processing loop"""
        if self.is_running:
            return
        self.executor = ThreadPoolExecutor(max_workers=self.num_workers)
        self.is_running = True
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._processing_loop, daemon=True)
        self._thread.start()
        logger.info("StreamProcessor started")

    def stop(self):
        """Stop background processing loop and shutdown executor"""
        if not self.is_running:
            return
        self.is_running = False
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        if self.executor:
            self.executor.shutdown(wait=False, cancel_futures=True)
            self.executor = None
        logger.info("StreamProcessor stopped")

    def _processing_loop(self):
        """Background worker loop"""
        while self.is_running and not self._stop_event.is_set():
            time.sleep(0.1)

    def get_status(self) -> Dict[str, Any]:
        """Get stream processor running status and active processor names"""
        return {
            "is_running": self.is_running,
            "processors": list(self.processors.keys()),
        }


class RealTimeStreamProcessor:
    """Real-time stream processing engine"""
    
    def __init__(self, window_size_seconds=60):
        self.window_size = window_size_seconds
        self.windows = {}
        self.processors = []
        self.aggregators = {}
        self.is_running = False
        self.processing_interval = 10  # seconds
    
    def add_processor(self, processor_func: Callable):
        """Add a custom processor"""
        self.processors.append(processor_func)
    
    def add_aggregator(self, aggregator_name: str, aggregator_func: Callable):
        """Add a custom aggregator"""
        self.aggregators[aggregator_name] = aggregator_func
    
    def process_event(self, event: Dict[str, Any]):
        """Process a single event"""
        try:
            # Apply all processors
            processed_event = event
            for processor in self.processors:
                processed_event = processor(processed_event)
            
            # Add to window
            self._add_to_window(processed_event)
            
            return processed_event
        except Exception as e:
            logger.error(f"Event processing error: {e}")
            return event
    
    def _add_to_window(self, event: Dict[str, Any]):
        """Add event to sliding window"""
        timestamp = datetime.fromisoformat(event.get('timestamp', datetime.now().isoformat()))
        window_key = timestamp.strftime('%Y-%m-%d %H:%M')
        
        if window_key not in self.windows:
            self.windows[window_key] = []
        
        self.windows[window_key].append(event)
        
        # Clean old windows
        self._clean_windows()
    
    def _clean_windows(self):
        """Remove expired windows"""
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(seconds=self.window_size)
        cutoff_key = cutoff_time.strftime('%Y-%m-%d %H:%M')
        
        expired_keys = [k for k in self.windows.keys() if k < cutoff_key]
        for key in expired_keys:
            del self.windows[key]
    
    def get_aggregated_data(self) -> Dict[str, Any]:
        """Get aggregated stream data"""
        aggregated = {}
        
        # Apply all aggregators
        for name, aggregator in self.aggregators.items():
            try:
                aggregated[name] = aggregator(self.windows)
            except Exception as e:
                logger.error(f"Aggregator {name} error: {e}")
        
        return aggregated
    
    def get_recent_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent events"""
        all_events = []
        for window in sorted(self.windows.keys(), reverse=True):
            all_events.extend(self.windows[window])
            if len(all_events) >= limit:
                break
        
        return all_events[:limit]
    
    def compute_stats(self) -> Dict[str, Any]:
        """Compute real-time statistics"""
        all_events = self.get_recent_events(1000)
        
        if not all_events:
            return {'error': 'No events available'}
        
        df = pd.DataFrame(all_events)
        
        stats = {
            'total_events': len(all_events),
            'unique_sources': df['source'].nunique() if 'source' in df else 0,
            'average_duration': df['duration'].mean() if 'duration' in df else 0,
            'max_duration': df['duration'].max() if 'duration' in df else 0,
            'last_event_time': df['timestamp'].max() if 'timestamp' in df else None
        }
        
        return stats
    
    def start(self):
        """Start the stream processor"""
        self.is_running = True
        logger.info("Stream processor started")
    
    def stop(self):
        """Stop the stream processor"""
        self.is_running = False
        logger.info("Stream processor stopped")
