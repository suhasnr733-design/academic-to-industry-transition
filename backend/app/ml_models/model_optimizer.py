# backend/app/ml_models/model_optimizer.py

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import os
import time

class ModelOptimizer:
    """Optimize ML models for production"""
    
    def __init__(self):
        self.model_path = 'data/models/'
    
    def optimize_model(self, model_name='ensemble_model.pkl'):
        """Optimize model size and inference speed"""
        model = joblib.load(f'{self.model_path}{model_name}')
        
        # Check model size
        original_size = os.path.getsize(f'{self.model_path}{model_name}')
        print(f"Original model size: {original_size / 1024:.2f} KB")
        
        # Option 1: Reduce precision (quantization)
        # For scikit-learn, we can convert to float32
        if hasattr(model, 'estimators_'):
            for estimator in model.estimators_:
                if hasattr(estimator, 'feature_importances_'):
                    # Already float64, can't easily quantize in sklearn
                    pass
        
        # Option 2: Remove unnecessary attributes
        # Save only essential attributes
        optimized_model = self._compress_model(model)
        
        # Save optimized model
        optimized_path = f'{self.model_path}optimized_{model_name}'
        joblib.dump(optimized_model, optimized_path, compress=3)
        optimized_size = os.path.getsize(optimized_path)
        
        print(f"Optimized model size: {optimized_size / 1024:.2f} KB")
        print(f"Size reduction: {(1 - optimized_size/original_size) * 100:.1f}%")
        
        return optimized_model
    
    def _compress_model(self, model):
        """Compress model by removing unnecessary attributes"""
        # Create a lightweight copy
        if hasattr(model, 'estimators_'):
            # For ensemble models
            compressed = model.__class__()
            for attr in ['estimators_', 'n_features_in_', 'feature_names_in_']:
                if hasattr(model, attr):
                    setattr(compressed, attr, getattr(model, attr))
            
            # Remove large unnecessary attributes
            for estimator in compressed.estimators_:
                if hasattr(estimator, 'tree_'):
                    # Keep only essential tree attributes
                    pass
        else:
            compressed = model
        
        return compressed
    
    def benchmark_inference(self, model, n_samples=1000):
        """Benchmark inference speed"""
        import time
        import numpy as np
        
        # Generate random test data
        n_features = model.n_features_in_ if hasattr(model, 'n_features_in_') else 10
        X_test = np.random.randn(n_samples, n_features)
        
        # Warm up
        for _ in range(10):
            model.predict(X_test[:10])
        
        # Benchmark
        start_time = time.time()
        for _ in range(10):
            model.predict(X_test)
        total_time = time.time() - start_time
        
        avg_time = (total_time / 10) / n_samples * 1000  # ms per sample
        print(f"Average inference time: {avg_time:.3f} ms/sample")
        print(f"Total time for {n_samples*10} predictions: {total_time:.3f} s")
        
        return avg_time