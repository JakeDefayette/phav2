/**
 * Memoization Utilities
 *
 * Provides utilities for component memoization and performance optimization
 */

import React from 'react';

/**
 * Smart memo wrapper that provides better comparison for common prop patterns
 */
export function smartMemo<T extends React.ComponentType<any>>(
  Component: T,
  compare?: (
    prevProps: Readonly<React.ComponentProps<T>>,
    nextProps: Readonly<React.ComponentProps<T>>
  ) => boolean
): T {
  const defaultCompare = (
    prevProps: Readonly<React.ComponentProps<T>>,
    nextProps: Readonly<React.ComponentProps<T>>
  ): boolean => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    // Different number of props
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    // Check each prop
    for (const key of prevKeys) {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];

      // Handle function props (common source of unnecessary re-renders)
      if (typeof prevValue === 'function' && typeof nextValue === 'function') {
        // Functions are considered equal if they have the same reference
        if (prevValue !== nextValue) {
          return false;
        }
        continue;
      }

      // Handle array props (shallow comparison)
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) {
          return false;
        }
        for (let i = 0; i < prevValue.length; i++) {
          if (prevValue[i] !== nextValue[i]) {
            return false;
          }
        }
        continue;
      }

      // Handle object props (shallow comparison)
      if (
        prevValue &&
        nextValue &&
        typeof prevValue === 'object' &&
        typeof nextValue === 'object'
      ) {
        const prevObjKeys = Object.keys(prevValue);
        const nextObjKeys = Object.keys(nextValue);

        if (prevObjKeys.length !== nextObjKeys.length) {
          return false;
        }

        for (const objKey of prevObjKeys) {
          if (prevValue[objKey] !== nextValue[objKey]) {
            return false;
          }
        }
        continue;
      }

      // Primitive comparison
      if (prevValue !== nextValue) {
        return false;
      }
    }

    return true;
  };

  // Use proper typing for React.memo
  const compareFunction = compare || defaultCompare;
  return React.memo(
    Component as React.FunctionComponent<React.ComponentProps<T>>,
    compareFunction
  ) as unknown as T;
}

/**
 * Memoize expensive calculations
 */
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T {
  return React.useMemo(calculation, dependencies);
}

/**
 * Memoize callback functions to prevent unnecessary re-renders
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  return React.useCallback(callback, dependencies);
}

/**
 * Memoize complex objects
 */
export function useMemoizedObject<T extends Record<string, any>>(
  object: T,
  dependencies: React.DependencyList
): T {
  return React.useMemo(() => object, [...dependencies, object]);
}

/**
 * Memoize component props to prevent unnecessary re-renders
 */
export function useMemoizedProps<T extends Record<string, any>>(props: T): T {
  const depValues = Object.values(props);
  return React.useMemo(() => props, [...depValues, props]);
}

/**
 * Debounced value hook for performance optimization
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled value hook for performance optimization
 */
export function useThrottledValue<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= interval) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      interval - (Date.now() - lastRan.current)
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, interval]);

  return throttledValue;
}

/**
 * Virtualized list hook for rendering large lists efficiently
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = React.useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    setScrollTop,
  };
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);

        if (isVisible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasBeenVisible]);

  return { isIntersecting, hasBeenVisible };
}

/**
 * Lazy component loader with intersection observer
 */
export function useLazyComponent<T extends React.ComponentType<any>>(
  componentLoader: () => Promise<{ default: T }>,
  triggerRef: React.RefObject<Element>
) {
  const [Component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const { isIntersecting, hasBeenVisible } =
    useIntersectionObserver(triggerRef);

  React.useEffect(() => {
    if ((isIntersecting || hasBeenVisible) && !Component && !loading) {
      setLoading(true);
      setError(null);
      componentLoader()
        .then(module => {
          setComponent(() => module.default);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load component:', err);
          setError(err);
          setLoading(false);
        });
    }
  }, [isIntersecting, hasBeenVisible, Component, loading, componentLoader]);

  if (error) {
    // Optionally render a fallback UI or re-throw
    console.error('Lazy component load error:', error);
    // return <p>Error loading component.</p>;
  }

  return Component;
}

/**
 * Performance measurement hook
 */
export function usePerformanceMeasure(
  name: string,
  dependencies: React.DependencyList
) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      }

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production' && duration > 100) {
        // Report slow operations
        console.warn(`Slow operation [${name}]: ${duration.toFixed(2)}ms`);
      }
    };
  }, [...dependencies, name]);
}

/**
 * Higher-order component for automatic memoization
 */
export function withMemoization<P extends object>(
  Component: React.ComponentType<P>,
  compareFunction?: (prevProps: P, nextProps: P) => boolean
) {
  return smartMemo(Component, compareFunction);
}

/**
 * Hook to prevent unnecessary re-renders when props haven't changed
 */
export function useStableProps<T extends Record<string, any>>(props: T): T {
  const stableProps = React.useRef<T>(props);

  const hasChanged = React.useMemo(() => {
    const prevProps = stableProps.current;
    const currentProps = props;

    // Shallow comparison
    const prevKeys = Object.keys(prevProps);
    const currentKeys = Object.keys(currentProps);

    if (prevKeys.length !== currentKeys.length) {
      return true;
    }

    for (const key of prevKeys) {
      if (prevProps[key] !== currentProps[key]) {
        return true;
      }
    }

    return false;
  }, [props]);

  if (hasChanged) {
    stableProps.current = props;
  }

  return stableProps.current;
}
