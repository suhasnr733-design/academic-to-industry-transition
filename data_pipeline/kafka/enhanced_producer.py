# data_pipeline/kafka/enhanced_producer.py

from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, List
import threading
import queue

logger = logging.getLogger(__name__)

class EnhancedKafkaProducer:
    """Enhanced Kafka producer with batching and retry"""
    
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self._init_producer()
        self.batch_queue = queue.Queue()
        self.batch_size = 100
        self.batch_timeout = 5  # seconds
        self.is_running = False
        self.batch_thread = None
    
    def _init_producer(self):
        """Initialize Kafka producer"""
        self.producer = KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',
            retries=3,
            max_in_flight_requests_per_connection=5,
            compression_type='gzip',
            batch_size=16384,
            linger_ms=100,
            buffer_memory=33554432
        )
        logger.info("✅ Kafka producer initialized")
    
    def send_message(self, topic: str, key: str, value: Dict[str, Any]) -> bool:
        """Send a single message"""
        try:
            future = self.producer.send(topic, key=key, value=value)
            record_metadata = future.get(timeout=10)
            logger.debug(f"Message sent to {topic}: partition {record_metadata.partition}, offset {record_metadata.offset}")
            return True
        except KafkaError as e:
            logger.error(f"Kafka error: {e}")
            return False
    
    def send_batch(self, topic: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Send batch messages"""
        results = {
            'total': len(messages),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for message in messages:
            key = message.get('key', str(message.get('id', '')))
            if self.send_message(topic, key, message):
                results['success'] += 1
            else:
                results['failed'] += 1
        
        return results
    
    def start_batch_processor(self):
        """Start background batch processing"""
        if self.is_running:
            return
        
        self.is_running = True
        self.batch_thread = threading.Thread(target=self._process_batch_queue)
        self.batch_thread.daemon = True
        self.batch_thread.start()
        logger.info("✅ Batch processor started")
    
    def _process_batch_queue(self):
        """Process queued messages in batches"""
        while self.is_running:
            try:
                # Get batch of messages
                messages = []
                start_time = time.time()
                
                while len(messages) < self.batch_size and (time.time() - start_time) < self.batch_timeout:
                    try:
                        item = self.batch_queue.get(timeout=1)
                        messages.append(item)
                    except queue.Empty:
                        continue
                
                if messages:
                    # Group by topic
                    topic_messages = {}
                    for msg in messages:
                        topic = msg['topic']
                        if topic not in topic_messages:
                            topic_messages[topic] = []
                        topic_messages[topic].append(msg['data'])
                    
                    # Send batches
                    for topic, batch in topic_messages.items():
                        self.send_batch(topic, batch)
                    
                    logger.info(f"Processed batch of {len(messages)} messages")
                    
            except Exception as e:
                logger.error(f"Batch processing error: {e}")
    
    def queue_message(self, topic: str, data: Dict[str, Any]):
        """Queue a message for batch processing"""
        self.batch_queue.put({
            'topic': topic,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
    
    def stop(self):
        """Stop the producer"""
        self.is_running = False
        if self.batch_thread:
            self.batch_thread.join(timeout=10)
        if self.producer:
            self.producer.flush()
            self.producer.close()
        logger.info("✅ Kafka producer stopped")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get producer metrics"""
        if not self.producer:
            return {'error': 'Producer not initialized'}
        
        metrics = self.producer.metrics()
        return {
            'queue_size': self.batch_queue.qsize(),
            'is_running': self.is_running,
            'metrics': {
                'requests': metrics.get('kafka-producer-network-request-rate', {}),
                'errors': metrics.get('kafka-producer-io-error-rate', {})
            }
        }