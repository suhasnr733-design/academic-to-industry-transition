# backend/app/services/batch_processor.py

import asyncio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Callable
import logging
from tqdm import tqdm

logger = logging.getLogger(__name__)

class BatchProcessor:
    """High-performance batch processing for ML models"""
    
    def __init__(self):
        self.max_workers = mp.cpu_count()
        self.logger = logging.getLogger(__name__)
    
    def process_batch(self, items: List[Any], process_func: Callable, 
                     batch_size: int = 100, use_processes: bool = True) -> List[Any]:
        """Process items in batches with parallelization"""
        results = []
        
        # Split into batches
        batches = [items[i:i+batch_size] for i in range(0, len(items), batch_size)]
        
        # Process batches in parallel
        if use_processes:
            with ProcessPoolExecutor(max_workers=self.max_workers) as executor:
                batch_results = list(tqdm(
                    executor.map(process_func, batches),
                    total=len(batches),
                    desc="Processing batches"
                ))
        else:
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                batch_results = list(tqdm(
                    executor.map(process_func, batches),
                    total=len(batches),
                    desc="Processing batches"
                ))
        
        # Flatten results
        for result in batch_results:
            if isinstance(result, list):
                results.extend(result)
            else:
                results.append(result)
        
        return results
    
    def async_process(self, items: List[Any], process_func: Callable,
                     concurrency: int = 10) -> List[Any]:
        """Asynchronous processing"""
        async def process_all():
            semaphore = asyncio.Semaphore(concurrency)
            
            async def process_item(item):
                async with semaphore:
                    return process_func(item)
            
            tasks = [process_item(item) for item in items]
            return await asyncio.gather(*tasks)
        
        return asyncio.run(process_all())
    
    def predict_employability_batch(self, student_data: List[Dict[str, Any]], 
                                   model, scaler, features) -> List[Dict[str, Any]]:
        """Batch employability prediction"""
        def predict_batch(batch):
            X = np.array([[data.get(f, 0) for f in features] for data in batch])
            X_scaled = scaler.transform(X)
            predictions = model.predict(X_scaled)
            probabilities = model.predict_proba(X_scaled)
            
            results = []
            for i, data in enumerate(batch):
                results.append({
                    'student_id': data.get('student_id'),
                    'employable': bool(predictions[i]),
                    'confidence': float(max(probabilities[i]) * 100)
                })
            return results
        
        return self.process_batch(student_data, predict_batch, batch_size=50)
    
    def parallel_skill_extraction(self, texts: List[str], skill_extractor) -> List[List[str]]:
        """Parallel skill extraction"""
        def extract_batch(batch):
            return [skill_extractor.extract_skills_enhanced(text) for text in batch]
        
        results = self.process_batch(texts, extract_batch, batch_size=50, use_processes=True)
        
        # Extract skills from results
        extracted_skills = []
        for result in results:
            if isinstance(result, list):
                for item in result:
                    if isinstance(item, dict) and 'all_skills' in item:
                        extracted_skills.append(item['all_skills'])
                    else:
                        extracted_skills.append(item)
            else:
                extracted_skills.append(result)
        
        return extracted_skills
    
    def batch_semantic_search(self, queries: List[str], search_service, top_k: int = 10) -> List[List[Dict]]:
        """Batch semantic search"""
        def search_batch(batch):
            return [search_service.search_jobs(query, top_k) for query in batch]
        
        return self.process_batch(queries, search_batch, batch_size=20, use_processes=False)