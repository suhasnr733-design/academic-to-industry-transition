# data_pipeline/optimization/performance_optimizer.py

from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

from typing import List, Dict, Any, Callable, Generator, Iterable, Union, Optional
import pandas as pd

logger = logging.getLogger(__name__)


class PerformanceOptimizer:
    """Utility for parallel processing, chunked batching, and query optimization."""

    def __init__(self, max_workers: int = 4):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.max_workers = max_workers

    def parallel_process(
        self,
        data: Union[pd.DataFrame, List[Any]],
        process_func: Callable[[Union[pd.DataFrame, List[Any]]], Union[pd.DataFrame, List[Any]]],
        chunksize: int = 1000
    ) -> Union[pd.DataFrame, List[Any]]:
        """
        Process data in parallel chunks using ThreadPoolExecutor.

        Args:
            data (pd.DataFrame | list): Input dataset to process.
            process_func (callable): Function accepting a chunk and returning processed result chunk.
            chunksize (int): Size of each chunk.

        Returns:
            pd.DataFrame | list: Combined processed dataset. Safely handles empty input.
        """
        if data is None:
            return [] if not isinstance(data, pd.DataFrame) else pd.DataFrame()

        is_df = isinstance(data, pd.DataFrame)
        if is_df and data.empty:
            return pd.DataFrame()
        if not is_df and len(data) == 0:
            return []

        # Partition into chunks
        chunks = []
        if is_df:
            num_rows = len(data)
            for i in range(0, num_rows, chunksize):
                chunks.append(data.iloc[i:i + chunksize].copy())
        else:
            data_list = list(data)
            num_items = len(data_list)
            for i in range(0, num_items, chunksize):
                chunks.append(data_list[i:i + chunksize])

        if not chunks:
            return pd.DataFrame() if is_df else []

        results = [None] * len(chunks)
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_index = {
                executor.submit(process_func, chunk): idx
                for idx, chunk in enumerate(chunks)
            }
            for future in as_completed(future_to_index):
                idx = future_to_index[future]
                try:
                    results[idx] = future.result()
                except Exception as e:
                    self.logger.error(f"Error processing chunk {idx}: {e}")
                    results[idx] = pd.DataFrame() if is_df else []

        # Filter out None results
        valid_results = [r for r in results if r is not None]
        if not valid_results:
            return pd.DataFrame() if is_df else []

        if is_df or any(isinstance(r, pd.DataFrame) for r in valid_results):
            df_results = [r for r in valid_results if isinstance(r, pd.DataFrame) and not r.empty]
            return pd.concat(df_results, ignore_index=True) if df_results else pd.DataFrame()
        else:
            combined = []
            for r in valid_results:
                if isinstance(r, list):
                    combined.extend(r)
                else:
                    combined.append(r)
            return combined

    def batch_process(
        self,
        items: Union[List[Any], pd.DataFrame, Iterable[Any]],
        batch_size: int = 1000
    ) -> Generator[Union[List[Any], pd.DataFrame], None, None]:
        """
        Yield batches of size `batch_size` from `items`, properly yielding the final partial batch.

        Args:
            items (list | DataFrame | iterable): Items to batch.
            batch_size (int): Size of each batch.

        Yields:
            list | DataFrame: Batch slice.
        """
        if items is None:
            return

        if isinstance(items, pd.DataFrame):
            n = len(items)
            for i in range(0, n, batch_size):
                yield items.iloc[i:i + batch_size].copy()
        elif isinstance(items, (list, tuple)):
            n = len(items)
            for i in range(0, n, batch_size):
                yield items[i:i + batch_size]
        else:
            batch = []
            for item in items:
                batch.append(item)
                if len(batch) == batch_size:
                    yield batch
                    batch = []
            if batch:
                yield batch

    def optimize_query(
        self,
        query: str,
        index_columns: Optional[List[str]] = None
    ) -> str:
        """
        Sanitize and format SQL query for performance without changing query semantics.

        Args:
            query (str): SQL query string.
            index_columns (list, optional): List of column names to consider for indexing.

        Returns:
            str: Cleaned and optimized SQL query string.
        """
        if not query:
            return ""

        cleaned_query = " ".join(query.strip().split())

        if index_columns:
            self.logger.info(f"Query optimization inspected index columns: {index_columns}")

        return cleaned_query


performance_optimizer = PerformanceOptimizer()
