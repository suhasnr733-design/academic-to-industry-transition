# data_pipeline/resilience/fault_tolerance.py

from functools import wraps
import logging
import time
from typing import Dict, List, Any, Callable, Optional, Type

logger = logging.getLogger(__name__)


class CircuitBreakerError(Exception):
    """Exception raised when a call is rejected by an open CircuitBreaker."""
    pass


class CircuitBreaker:
    """Stateful circuit breaker instance."""

    def __init__(self, failure_threshold: int = 3, timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.last_state_change = time.time()
        self.logger = logging.getLogger(self.__class__.__name__)

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()

            # Check if circuit should transition from OPEN to HALF-OPEN after timeout
            if self.state == "OPEN":
                if now - self.last_state_change >= self.timeout:
                    self.state = "HALF-OPEN"
                    self.last_state_change = now
                    self.logger.info("CircuitBreaker state changed: OPEN -> HALF-OPEN")
                else:
                    raise CircuitBreakerError(
                        f"CircuitBreaker is OPEN. Calls rejected for function '{func.__name__}'"
                    )

            try:
                result = func(*args, **kwargs)
                # Success in HALF-OPEN or CLOSED resets the circuit
                if self.state in ("OPEN", "HALF-OPEN") or self.failure_count > 0:
                    self.logger.info(f"CircuitBreaker state changed: {self.state} -> CLOSED")
                    self.state = "CLOSED"
                    self.failure_count = 0
                    self.last_state_change = now
                return result

            except Exception as e:
                self.failure_count += 1
                self.logger.warning(
                    f"CircuitBreaker failure count for '{func.__name__}': {self.failure_count}/{self.failure_threshold}"
                )
                if self.failure_count >= self.failure_threshold:
                    if self.state != "OPEN":
                        self.state = "OPEN"
                        self.last_state_change = now
                        self.logger.warning(f"CircuitBreaker state changed -> OPEN for '{func.__name__}'")
                raise e

        return wrapper

    def reset(self) -> None:
        """Reset circuit breaker to CLOSED state."""
        self.state = "CLOSED"
        self.failure_count = 0
        self.last_state_change = time.time()


class FaultTolerance:
    """Fault tolerance utility providing configurable retry and circuit breaker mechanisms."""

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def retry(
        self,
        max_retries: int = 3,
        delay: float = 5.0,
        backoff: float = 1.0,
        exceptions: tuple = (Exception,)
    ) -> Callable:
        """
        Retry decorator for functions that may experience transient failures.

        Args:
            max_retries (int): Maximum number of retry attempts.
            delay (float): Delay in seconds between retries.
            backoff (float): Multiplier applied to delay after each retry.
            exceptions (tuple): Exception types to catch and retry.

        Returns:
            callable: Wrapped decorator.
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                current_delay = delay
                last_exception = None

                for attempt in range(1, max_retries + 1):
                    try:
                        return func(*args, **kwargs)
                    except exceptions as e:
                        last_exception = e
                        self.logger.warning(
                            f"Attempt {attempt}/{max_retries} failed for '{func.__name__}': {e}"
                        )
                        if attempt < max_retries:
                            if current_delay > 0:
                                time.sleep(current_delay)
                            current_delay *= backoff

                self.logger.error(
                    f"All {max_retries} retry attempts failed for '{func.__name__}'"
                )
                if last_exception:
                    raise last_exception

            return wrapper

        return decorator

    def circuit_breaker(
        self,
        failure_threshold: int = 3,
        timeout: float = 60.0
    ) -> CircuitBreaker:
        """
        Create a new instance of CircuitBreaker decorator.

        Args:
            failure_threshold (int): Failures before opening circuit.
            timeout (float): Open state duration in seconds.

        Returns:
            CircuitBreaker: Circuit breaker instance.
        """
        return CircuitBreaker(failure_threshold=failure_threshold, timeout=timeout)


fault_tolerance = FaultTolerance()
