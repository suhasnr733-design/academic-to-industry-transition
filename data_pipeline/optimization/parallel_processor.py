# data_pipeline/optimization/parallel_processor.py

from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
import logging
import os
from typing import List, Dict, Any, Callable, Optional, Union
import pandas as pd

logger = logging.getLogger(__name__)


def _top_level_worker_wrapper(func: Callable, chunk: Any) -> Any:
    """Top-level helper function for ProcessPoolExecutor pickling compatibility."""
    return func(chunk)


class ParallelProcessor:
    """Parallel execution utility supporting Process and Thread pools for DataFrames and files."""

    def __init__(self, max_workers: Optional[int] = None):
        self.logger = logging.getLogger(self.__class__.__name__)
        cpu_count = os.cpu_count() or 4
        if max_workers is None or max_workers <= 0:
            self.max_workers = cpu_count
        else:
            self.max_workers = max(1, int(max_workers))

    def parallel_apply(
        self,
        df: pd.DataFrame,
        func: Callable[[pd.DataFrame], pd.DataFrame],
        chunksize: Optional[int] = None,
        use_processes: bool = False
    ) -> pd.DataFrame:
        """
        Process DataFrame in parallel chunks using ThreadPoolExecutor or ProcessPoolExecutor.

        Args:
            df (pd.DataFrame): Input DataFrame.
            func (callable): Function accepting a chunk and returning a processed DataFrame.
            chunksize (int, optional): Size of each chunk.
            use_processes (bool): Whether to use ProcessPoolExecutor (default False/True as requested).

        Returns:
            pd.DataFrame: Combined processed DataFrame.
        """
        if df is None or df.empty:
            return pd.DataFrame() if df is None else df.copy()

        num_rows = len(df)
        if chunksize is None or chunksize <= 0:
            chunksize = max(1, num_rows // (self.max_workers * 2))

        chunks = [df.iloc[i:i + chunksize].copy() for i in range(0, num_rows, chunksize)]
        if not chunks:
            return pd.DataFrame()

        results = [None] * len(chunks)
        executor_cls = ProcessPoolExecutor if use_processes else ThreadPoolExecutor

        try:
            with executor_cls(max_workers=self.max_workers) as executor:
                if use_processes:
                    future_to_idx = {
                        executor.submit(_top_level_worker_wrapper, func, chunk): idx
                        for idx, chunk in enumerate(chunks)
                    }
                else:
                    future_to_idx = {
                        executor.submit(func, chunk): idx
                        for idx, chunk in enumerate(chunks)
                    }

                for future in as_completed(future_to_idx):
                    idx = future_to_idx[future]
                    try:
                        results[idx] = future.result()
                    except Exception as e:
                        self.logger.error(f"Parallel worker chunk {idx} failed: {e}")
                        results[idx] = pd.DataFrame()
        except Exception as pe:
            self.logger.warning(f"ProcessPool execution failed, falling back to ThreadPool: {pe}")
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                future_to_idx = {
                    executor.submit(func, chunk): idx
                    for idx, chunk in enumerate(chunks)
                }
                for future in as_completed(future_to_idx):
                    idx = future_to_idx[future]
                    try:
                        results[idx] = future.result()
                    except Exception as e:
                        self.logger.error(f"Fallback worker chunk {idx} failed: {e}")
                        results[idx] = pd.DataFrame()

        valid_results = [r for r in results if isinstance(r, pd.DataFrame) and not r.empty]
        if not valid_results:
            return pd.DataFrame()
        return pd.concat(valid_results, ignore_index=True)

    def process_batch(
        self,
        items: Union[List[Any], pd.DataFrame],
        process_func: Callable[[List[Any]], List[Any]],
        batch_size: int = 100
    ) -> List[Any]:
        """
        Split items into batches, process batches in parallel, and flatten results.

        Args:
            items (list | DataFrame): Items to process.
            process_func (callable): Batch processing function.
            batch_size (int): Size of each batch.

        Returns:
            list: Flattened list of processed items.
        """
        if items is None:
            return []

        is_df = isinstance(items, pd.DataFrame)
        if is_df and items.empty:
            return []
        if not is_df and len(items) == 0:
            return []

        item_list = items.to_dict('records') if is_df else list(items)
        batches = [item_list[i:i + batch_size] for i in range(0, len(item_list), batch_size)]

        results = [None] * len(batches)
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_idx = {
                executor.submit(process_func, batch): idx
                for idx, batch in enumerate(batches)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    self.logger.error(f"Error processing batch {idx}: {e}")
                    results[idx] = []

        flattened = []
        for res in results:
            if isinstance(res, list):
                flattened.extend(res)
            elif res is not None:
                flattened.append(res)
        return flattened

    def parallel_read(
        self,
        file_paths: List[str],
        read_func: Optional[Callable[[str], pd.DataFrame]] = None
    ) -> pd.DataFrame:
        """
        Read multiple files concurrently and combine into a single DataFrame.

        Args:
            file_paths (list[str]): List of file paths to read.
            read_func (callable, optional): Custom reader function (defaults to pd.read_csv/pd.read_parquet).

        Returns:
            pd.DataFrame: Combined DataFrame from all readable files.
        """
        if not file_paths:
            return pd.DataFrame()

        def _default_read(path: str) -> pd.DataFrame:
            if not os.path.exists(path):
                return pd.DataFrame()
            if path.endswith('.parquet'):
                return pd.read_parquet(path)
            return pd.read_csv(path)

        reader = read_func or _default_read
        dfs = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_path = {executor.submit(reader, path): path for path in file_paths}
            for future in as_completed(future_to_path):
                path = future_to_path[future]
                try:
                    res_df = future.result()
                    if isinstance(res_df, pd.DataFrame) and not res_df.empty:
                        dfs.append(res_df)
                except Exception as e:
                    self.logger.error(f"Error reading file '{path}': {e}")

        if not dfs:
            return pd.DataFrame()
        return pd.concat(dfs, ignore_index=True)


parallel_processor = ParallelProcessor()
