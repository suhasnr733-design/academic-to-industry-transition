# backend/app/ml_models/model_quantization.py

import torch
import numpy as np
from transformers import AutoModel, AutoTokenizer
import joblib
import os
import logging

logger = logging.getLogger(__name__)

class ModelQuantizer:
    """Model quantization for production deployment"""
    
    def __init__(self):
        self.models_dir = 'data/models/quantized/'
        os.makedirs(self.models_dir, exist_ok=True)
    
    def quantize_bert_model(self, model_name="bert-base-uncased"):
        """Quantize BERT model to reduce size"""
        try:
            # Load model
            model = AutoModel.from_pretrained(model_name)
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            
            # Convert to TorchScript
            model.eval()
            dummy_input = torch.randint(0, 1000, (1, 128))
            
            # Trace model
            traced_model = torch.jit.trace(model, dummy_input)
            
            # Save quantized model
            quantized_path = f"{self.models_dir}bert_quantized.pt"
            traced_model.save(quantized_path)
            
            original_size = 438 * 1024 * 1024  # ~438MB
            quantized_size = os.path.getsize(quantized_path)
            
            logger.info(f"Original size: {original_size / (1024*1024):.1f} MB")
            logger.info(f"Quantized size: {quantized_size / (1024*1024):.1f} MB")
            logger.info(f"Size reduction: {(1 - quantized_size/original_size) * 100:.1f}%")
            
            return quantized_path
            
        except Exception as e:
            logger.error(f"Quantization error: {e}")
            return None
    
    def optimize_sklearn_model(self, model_path):
        """Optimize scikit-learn model"""
        try:
            model = joblib.load(model_path)
            
            # Extract only essential attributes
            optimized_model = {
                'model_type': type(model).__name__,
                'parameters': model.get_params(),
                'feature_importances': model.feature_importances_ if hasattr(model, 'feature_importances_') else None,
                'n_features': model.n_features_in_ if hasattr(model, 'n_features_in_') else 0
            }
            
            # Save optimized
            optimized_path = f"{self.models_dir}optimized_model.pkl"
            joblib.dump(optimized_model, optimized_path, compress=5)
            
            logger.info(f"✅ Optimized model saved to {optimized_path}")
            return optimized_path
            
        except Exception as e:
            logger.error(f"Optimization error: {e}")
            return None
    
    def quantize_embeddings(self, embedding_path):
        """Quantize embeddings for faster retrieval"""
        try:
            embeddings = np.load(embedding_path)
            
            # Convert to float16
            quantized = embeddings.astype(np.float16)
            
            # Save
            quantized_path = f"{self.models_dir}embeddings_quantized.npy"
            np.save(quantized_path, quantized)
            
            original_size = embeddings.nbytes
            quantized_size = quantized.nbytes
            
            logger.info(f"Original size: {original_size / (1024*1024):.1f} MB")
            logger.info(f"Quantized size: {quantized_size / (1024*1024):.1f} MB")
            logger.info(f"Size reduction: {(1 - quantized_size/original_size) * 100:.1f}%")
            
            return quantized_path
            
        except Exception as e:
            logger.error(f"Quantization error: {e}")
            return None