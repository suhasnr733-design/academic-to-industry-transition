# backend/ml_service/main.py
import os
import sys

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import uvicorn
from typing import List, Optional, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ML Prediction Service", version="1.0.0")

# Load model
class PredictionService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.features = None
        self.load_model()
    
    def _find_model_file(self, filename):
        candidates = [
            os.path.join('data', 'models', filename),
            os.path.join('..', 'data', 'models', filename),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'models', filename),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'models', filename),
        ]
        for p in candidates:
            if os.path.exists(p):
                return p
        return os.path.join('data', 'models', filename)

    def load_model(self):
        try:
            model_p = self._find_model_file('ensemble_model.pkl')
            scaler_p = self._find_model_file('scaler.pkl')
            feat_p = self._find_model_file('feature_columns.pkl')
            self.model = joblib.load(model_p)
            self.scaler = joblib.load(scaler_p)
            self.features = joblib.load(feat_p)
            logger.info("✅ Model loaded successfully from %s", model_p)
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    
    def predict(self, data: Dict):
        try:
            X = np.array([data.get(f, 0) for f in self.features]).reshape(1, -1)
            X_scaled = self.scaler.transform(X)
            prediction = self.model.predict(X_scaled)[0]
            probability = self.model.predict_proba(X_scaled)[0]
            
            return {
                'employable': bool(prediction),
                'confidence': float(max(probability) * 100),
                'probabilities': {
                    'not_employable': float(probability[0]),
                    'employable': float(probability[1])
                }
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {'error': str(e)}

service = PredictionService()

# Models for request/response
class PredictionRequest(BaseModel):
    cgpa: float
    skill_count: int
    skill_diversity: int
    internship_months: int
    projects: int
    certifications: int
    workshops: int
    total_experience: int
    cgpa_normalized: float
    certification_score: int
    skill_cgpa_ratio: float
    exp_skill_ratio: float
    department_encoded: int

class PredictionResponse(BaseModel):
    employable: bool
    confidence: float
    probabilities: Dict[str, float]

@app.get("/")
async def root():
    return {"message": "ML Prediction Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": service.model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Predict employability for a student"""
    try:
        data = request.dict()
        result = service.predict(data)
        
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])
        
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch")
async def predict_batch(requests: List[PredictionRequest]):
    """Batch prediction"""
    try:
        results = []
        for req in requests:
            data = req.dict()
            result = service.predict(data)
            results.append(result)
        return {"predictions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)