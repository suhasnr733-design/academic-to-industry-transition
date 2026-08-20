# data_pipeline/resilience/data_recovery.py

from datetime import datetime, timedelta
import logging
import os
import shutil
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class DataRecovery:
    """Manages dataset backups, restoration, backup inventory, and cleanup."""

    def __init__(self, backup_dir: Optional[str] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        if backup_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            self.backup_dir = os.path.join(base_dir, 'data', 'backup')
        else:
            self.backup_dir = os.path.abspath(backup_dir)

        os.makedirs(self.backup_dir, exist_ok=True)

    def create_backup(self, data_path: str) -> Optional[str]:
        """
        Verify source file exists and create a timestamped backup copy inside backup_dir.

        Args:
            data_path (str): Absolute or relative path to source file.

        Returns:
            str | None: Backup file path if successful, None otherwise.
        """
        if not os.path.exists(data_path) or not os.path.isfile(data_path):
            self.logger.error(f"Cannot create backup: source file '{data_path}' does not exist.")
            return None

        try:
            base_name = os.path.basename(data_path)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"{base_name}_{timestamp}.bak"
            backup_path = os.path.join(self.backup_dir, backup_filename)

            shutil.copy2(data_path, backup_path)
            self.logger.info(f"Backup created successfully: '{backup_path}'")
            return backup_path
        except Exception as e:
            self.logger.error(f"Error creating backup for '{data_path}': {e}")
            return None

    def restore_backup(self, backup_path: str, target_path: str) -> Dict[str, Any]:
        """
        Restore a backup file safely to the target path.

        Args:
            backup_path (str): Path to backup file.
            target_path (str): Target destination file path.

        Returns:
            dict: Status report.
        """
        if not os.path.exists(backup_path) or not os.path.isfile(backup_path):
            self.logger.error(f"Restore failed: backup file '{backup_path}' does not exist.")
            return {
                "success": False,
                "error": f"Backup file '{backup_path}' does not exist",
                "target_path": target_path
            }

        try:
            target_dir = os.path.dirname(os.path.abspath(target_path))
            os.makedirs(target_dir, exist_ok=True)

            shutil.copy2(backup_path, target_path)
            self.logger.info(f"Backup restored to '{target_path}' from '{backup_path}'")
            return {
                "success": True,
                "backup_path": backup_path,
                "target_path": target_path
            }
        except Exception as e:
            self.logger.error(f"Error restoring backup '{backup_path}' to '{target_path}': {e}")
            return {
                "success": False,
                "error": str(e),
                "target_path": target_path
            }

    def list_backups(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        List recent backup files in the backup directory created within the past N days.

        Args:
            days (int): Number of days lookback window.

        Returns:
            list[dict]: Backups inventory with file metadata.
        """
        if not os.path.exists(self.backup_dir):
            return []

        cutoff = datetime.now() - timedelta(days=days)
        backups = []

        try:
            for fname in os.listdir(self.backup_dir):
                if not fname.endswith('.bak'):
                    continue

                fpath = os.path.join(self.backup_dir, fname)
                if not os.path.isfile(fpath):
                    continue

                stat = os.stat(fpath)
                mtime = datetime.fromtimestamp(stat.st_mtime)

                if mtime >= cutoff:
                    backups.append({
                        "file": fname,
                        "path": fpath,
                        "created_at": mtime.isoformat(),
                        "size": stat.st_size
                    })

            backups.sort(key=lambda x: x["created_at"], reverse=True)
            return backups
        except Exception as e:
            self.logger.error(f"Error listing backups: {e}")
            return []

    def cleanup_backups(self, keep: int = 7) -> Dict[str, Any]:
        """
        Keep the newest 'keep' backups in backup_dir and remove older backup files.

        Args:
            keep (int): Number of newest backup files to retain.

        Returns:
            dict: Cleanup summary including removed file list.
        """
        if not os.path.exists(self.backup_dir):
            return {"removed_count": 0, "removed_files": []}

        try:
            bak_files = []
            for fname in os.listdir(self.backup_dir):
                if fname.endswith('.bak'):
                    fpath = os.path.join(self.backup_dir, fname)
                    if os.path.isfile(fpath):
                        mtime = os.path.getmtime(fpath)
                        bak_files.append((mtime, fpath, fname))

            bak_files.sort(key=lambda x: x[0], reverse=True)

            removed = []
            if len(bak_files) > keep:
                to_delete = bak_files[keep:]
                for mtime, fpath, fname in to_delete:
                    try:
                        os.remove(fpath)
                        removed.append(fname)
                        self.logger.info(f"Cleaned up old backup file: '{fname}'")
                    except Exception as de:
                        self.logger.error(f"Failed to delete backup file '{fname}': {de}")

            return {
                "retained_count": min(len(bak_files), keep),
                "removed_count": len(removed),
                "removed_files": removed
            }
        except Exception as e:
            self.logger.error(f"Error during backup cleanup: {e}")
            return {"removed_count": 0, "removed_files": [], "error": str(e)}


data_recovery = DataRecovery()
