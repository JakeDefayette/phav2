import { supabase } from '@/shared/services/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Base error class for service operations
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Database error class
 */
export class DatabaseError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

/**
 * Authentication error class
 */
export class AuthError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}

/**
 * Network error class
 */
export class NetworkError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * Configuration error class
 */
export class ConfigurationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Retry options interface
 */
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

/**
 * Utility function to retry operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Base service class providing common CRUD operations
 */
export abstract class BaseService<T = any, TInsert = any, TUpdate = any> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Handle Supabase errors and convert to ServiceError
   */
  protected handleError(
    error: PostgrestError | Error,
    operation: string
  ): never {
    if ('code' in error && 'details' in error) {
      // PostgrestError
      throw new ServiceError(
        `${operation} failed: ${error.message}`,
        error.code,
        error.details
      );
    } else {
      // Generic Error
      throw new ServiceError(`${operation} failed: ${error.message}`);
    }
  }

  /**
   * Get all records with optional filtering
   */
  async findAll(
    filters?: Record<string, any>,
    select?: string,
    orderBy?: { column: string; ascending?: boolean }
  ): Promise<T[]> {
    try {
      let query = supabase.from(this.tableName).select(select || '*');

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'Find all');
      }

      return data as T[];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find all');
    }
  }

  /**
   * Get a single record by ID
   */
  async findById(id: string, select?: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(select || '*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        this.handleError(error, 'Find by ID');
      }

      return data as T;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find by ID');
    }
  }

  /**
   * Find a single record by filters
   */
  async findOne(
    filters: Record<string, any>,
    select?: string
  ): Promise<T | null> {
    try {
      let query = supabase.from(this.tableName).select(select || '*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        this.handleError(error, 'Find one');
      }

      return data as T;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find one');
    }
  }

  /**
   * Create a new record
   */
  async create(data: TInsert, select?: string): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select(select || '*')
        .single();

      if (error) {
        this.handleError(error, 'Create');
      }

      return result as T;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Create');
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: TUpdate, select?: string): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select(select || '*')
        .single();

      if (error) {
        this.handleError(error, 'Update');
      }

      return result as T;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Update');
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, 'Delete');
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Delete');
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        this.handleError(error, 'Count');
      }

      return count || 0;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Count');
    }
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        this.handleError(error, 'Exists check');
      }

      return (count || 0) > 0;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Exists check');
    }
  }

  /**
   * Find records with pagination
   */
  async findWithPagination(
    page: number = 1,
    pageSize: number = 10,
    filters?: Record<string, any>,
    select?: string,
    orderBy?: { column: string; ascending?: boolean }
  ): Promise<{
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(this.tableName)
        .select(select || '*', { count: 'exact' })
        .range(from, to);

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      const { data, count, error } = await query;

      if (error) {
        this.handleError(error, 'Find with pagination');
      }

      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: data as T[],
        count: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      this.handleError(error as Error, 'Find with pagination');
    }
  }
}
