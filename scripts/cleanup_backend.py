# scripts/cleanup_backend.py

import os
import shutil
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class BackendCleanup:
    def __init__(self):
        self.keep_days = 30
    
    def cleanup_logs(self):
        """Clean up old logs"""
        log_dir = 'logs/'
        if not os.path.exists(log_dir):
            return
        
        cutoff = datetime.now() - timedelta(days=self.keep_days)
        for file in os.listdir(log_dir):
            if file.endswith('.log'):
                file_path = os.path.join(log_dir, file)
                file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                if file_time < cutoff:
                    os.remove(file_path)
                    logger.info(f"🗑️ Removed old log: {file}")
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        temp_dirs = ['tmp/', 'temp/', 'cache/']
        for dir_path in temp_dirs:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
                os.makedirs(dir_path, exist_ok=True)
                logger.info(f"✅ Cleaned: {dir_path}")
    
    def organize_docs(self):
        """Organize documentation"""
        docs_dir = 'docs/'
        if os.path.exists(docs_dir):
            files = os.listdir(docs_dir)
            for file in files:
                if file.endswith('.md'):
                    # Move to appropriate subdirectory
                    pass
    
    def run_cleanup(self):
        """Run all cleanup tasks"""
        self.cleanup_logs()
        self.cleanup_temp_files()
        self.organize_docs()
        logger.info("✅ Backend cleanup complete!")

backend_cleanup = BackendCleanup()