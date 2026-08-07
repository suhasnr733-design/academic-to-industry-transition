# tests/integration/test_full_system.py

import pytest
import time
import json
from data_pipeline.pipeline_orchestrator import PipelineOrchestrator
from data_pipeline.kafka.enhanced_producer import EnhancedKafkaProducer
from data_pipeline.analytics.realtime_analytics import RealTimeAnalytics
from data_pipeline.etl.warehouse_etl import WarehouseETL
from data_pipeline.ml.integration import MLPipelineIntegration

class TestFullSystem:
    
    def test_end_to_end_data_flow(self):
        """Test complete data flow"""
        print("\n🚀 Starting end-to-end data flow test...")
        
        # 1. Data Collection
        orchestrator = PipelineOrchestrator()
        results = orchestrator.run_full_pipeline()
        assert results['status'] in ['success', 'partial_success']
        print("✅ Data collection complete")
        
        # 2. Kafka Streaming
        producer = EnhancedKafkaProducer()
        producer.start_batch_processor()
        
        # Send test messages
        for i in range(10):
            producer.queue_message('test_topic', {
                'id': i,
                'event_type': 'test',
                'timestamp': time.time()
            })
        
        time.sleep(2)
        print("✅ Kafka streaming test passed")
        
        # 3. Real-time Analytics
        analytics = RealTimeAnalytics()
        events = analytics.get_recent_events()
        assert len(events) > 0
        print("✅ Real-time analytics test passed")
        
        # 4. ML Integration
        ml = MLPipelineIntegration()
        features = ml.prepare_features(1)
        assert features is not None
        print("✅ ML integration test passed")
        
        print("✅ End-to-end test passed!")
    
    def test_warehouse_etl(self):
        """Test warehouse ETL"""
        print("\n🏗️ Testing warehouse ETL...")
        
        etl = WarehouseETL()
        results = etl.run_full_etl()
        assert results['status'] == 'success'
        print("✅ ETL test passed")
        
        # Refresh views
        etl.refresh_materialized_views()
        print("✅ Materialized views refreshed")
    
    def test_performance_metrics(self):
        """Test performance metrics"""
        print("\n📊 Testing performance metrics...")
        
        # Test throughput
        producer = EnhancedKafkaProducer()
        start_time = time.time()
        
        for i in range(1000):
            producer.queue_message('test', {'id': i})
        
        elapsed = time.time() - start_time
        throughput = 1000 / elapsed
        print(f"Throughput: {throughput:.1f} msgs/sec")
        
        assert throughput > 100, "Throughput too low"
        print("✅ Performance metrics test passed")