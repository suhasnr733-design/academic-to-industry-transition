# backend/app/ml_models/model_registry.py

import joblib
import json
import os
from datetime import datetime
import hashlib
import pandas as pd

class ModelRegistry:
    """Model versioning and registry"""
    
    def __init__(self, registry_path='data/models/registry.json'):
        self.registry_path = registry_path
        self.registry = self.load_registry()
    
    def load_registry(self):
        """Load model registry"""
        if os.path.exists(self.registry_path):
            with open(self.registry_path, 'r') as f:
                return json.load(f)
        return {'models': [], 'current': None}
    
    def save_registry(self):
        """Save model registry"""
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2, default=str)
    
    def register_model(self, model_path, model_name, metadata=None):
        """Register a new model version"""
        # Compute model hash
        with open(model_path, 'rb') as f:
            model_hash = hashlib.md5(f.read()).hexdigest()
        
        # Get model metadata
        model_info = {
            'version': len(self.registry['models']) + 1,
            'name': model_name,
            'path': model_path,
            'hash': model_hash,
            'registered_at': datetime.now().isoformat(),
            'metadata': metadata or {},
            'is_active': True
        }
        
        # Deactivate previous models
        for m in self.registry['models']:
            m['is_active'] = False
        
        self.registry['models'].append(model_info)
        self.registry['current'] = model_info['version']
        self.save_registry()
        
        print(f"✅ Registered model v{model_info['version']}: {model_name}")
        return model_info
    
    def get_current_model(self):
        """Get current active model"""
        if self.registry['current'] is None:
            return None
        
        for model in self.registry['models']:
            if model['version'] == self.registry['current']:
                return model
        return None
    
    def get_model_by_version(self, version):
        """Get model by version number"""
        for model in self.registry['models']:
            if model['version'] == version:
                return model
        return None
    
    def list_models(self):
        """List all registered models"""
        return self.registry['models']
    
    def rollback(self, version):
        """Rollback to a specific version"""
        model = self.get_model_by_version(version)
        if model:
            for m in self.registry['models']:
                m['is_active'] = False
            model['is_active'] = True
            self.registry['current'] = version
            self.save_registry()
            print(f"✅ Rolled back to version {version}")
            return model
        return None
    
    def delete_model(self, version):
        """Delete a model version"""
        self.registry['models'] = [m for m in self.registry['models'] if m['version'] != version]
        if self.registry['current'] == version:
            self.registry['current'] = None
        self.save_registry()
        print(f"✅ Deleted version {version}")