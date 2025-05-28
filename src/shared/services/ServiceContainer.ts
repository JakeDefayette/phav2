/**
 * Service Container for Dependency Injection
 *
 * Provides a centralized way to register and resolve service dependencies,
 * making it easier to test, swap implementations, and manage service lifecycles.
 */

export type ServiceFactory<T = any> = () => T;
export type ServiceInstance<T = any> = T;

export interface ServiceDefinition<T = any> {
  factory: ServiceFactory<T>;
  singleton?: boolean;
  instance?: ServiceInstance<T>;
}

export class ServiceContainer {
  private services = new Map<string, ServiceDefinition>();
  private resolving = new Set<string>();

  /**
   * Register a service with the container
   *
   * @param key - Unique identifier for the service
   * @param factory - Function that creates the service instance
   * @param singleton - Whether to create only one instance (default: true)
   */
  register<T>(
    key: string,
    factory: ServiceFactory<T>,
    singleton: boolean = true
  ): void {
    if (this.services.has(key)) {
      throw new Error(`Service '${key}' is already registered`);
    }

    this.services.set(key, {
      factory,
      singleton,
      instance: undefined,
    });
  }

  /**
   * Get a service instance from the container
   *
   * @param key - Service identifier
   * @returns Service instance
   */
  get<T>(key: string): T {
    const definition = this.services.get(key);

    if (!definition) {
      throw new Error(
        `Service '${key}' not found. Did you forget to register it?`
      );
    }

    // Check for circular dependencies
    if (this.resolving.has(key)) {
      throw new Error(`Circular dependency detected for service '${key}'`);
    }

    // Return existing instance if singleton
    if (definition.singleton && definition.instance) {
      return definition.instance;
    }

    try {
      this.resolving.add(key);
      const instance = definition.factory();

      if (definition.singleton) {
        definition.instance = instance;
      }

      return instance;
    } finally {
      this.resolving.delete(key);
    }
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Unregister a service from the container
   */
  unregister(key: string): void {
    this.services.delete(key);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a scoped container (child container)
   * Inherits parent services but can override them
   */
  createScope(): ServiceContainer {
    const scopedContainer = new ServiceContainer();

    // Copy parent services
    for (const [key, definition] of this.services.entries()) {
      scopedContainer.services.set(key, { ...definition });
    }

    return scopedContainer;
  }
}

// Global container instance
export const container = new ServiceContainer();

/**
 * Decorator for automatic service injection
 *
 * @example
 * ```typescript
 * class MyService {
 *   @inject('emailService')
 *   private emailService!: EmailService;
 * }
 * ```
 */
export function inject(serviceKey: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return container.get(serviceKey);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * Service registration helper with type safety
 *
 * @example
 * ```typescript
 * registerService('emailService', () => new EmailService(config.email));
 * ```
 */
export function registerService<T>(
  key: string,
  factory: ServiceFactory<T>,
  singleton: boolean = true
): void {
  container.register(key, factory, singleton);
}

/**
 * Service resolution helper with type safety
 *
 * @example
 * ```typescript
 * const emailService = getService<EmailService>('emailService');
 * ```
 */
export function getService<T>(key: string): T {
  return container.get<T>(key);
}
