export interface MockQueryBuilder {
  select: jest.MockedFunction<any>;
  insert: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  upsert: jest.MockedFunction<any>;
  eq: jest.MockedFunction<any>;
  neq: jest.MockedFunction<any>;
  gte: jest.MockedFunction<any>;
  lte: jest.MockedFunction<any>;
  order: jest.MockedFunction<any>;
  limit: jest.MockedFunction<any>;
  single: jest.MockedFunction<any>;
  maybeSingle: jest.MockedFunction<any>;
  or: jest.MockedFunction<any>;
  returns: jest.MockedFunction<any>;
}

export interface MockSupabaseClient {
  from: jest.MockedFunction<any>;
}

/**
 * Creates a mock Supabase query builder with chainable methods
 */
export function createMockQueryBuilder(mockData?: any, mockError?: any): MockQueryBuilder {
  const mockBuilder: MockQueryBuilder = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    or: jest.fn(),
    returns: jest.fn(),
  };

  // Make all methods chainable and return the builder
  Object.keys(mockBuilder).forEach((method) => {
    if (method !== 'single' && method !== 'maybeSingle' && method !== 'returns') {
      mockBuilder[method as keyof MockQueryBuilder].mockReturnValue(mockBuilder);
    }
  });

  // The final method in chain should return the data/error response
  mockBuilder.single.mockResolvedValue({
    data: mockError ? null : (mockData || null),
    error: mockError || null,
  });

  mockBuilder.maybeSingle.mockResolvedValue({
    data: mockError ? null : (mockData || null),
    error: mockError || null,
  });

  // The returns() method should return the same response structure
  mockBuilder.returns.mockResolvedValue({
    data: mockError ? null : (mockData || null),
    error: mockError || null,
  });

  // For operations that chain with select().returns(), return a chainable object
  mockBuilder.select.mockImplementation(() => {
    const selectBuilder = {
      ...mockBuilder,
      single: jest.fn().mockResolvedValue({
        data: mockError ? null : (mockData || null),
        error: mockError || null,
      }),
      returns: jest.fn().mockResolvedValue({
        data: mockError ? null : (mockData || null),
        error: mockError || null,
      }),
    };
    return selectBuilder;
  });

  // For insert operations that chain with select().returns()
  mockBuilder.insert.mockImplementation(() => {
    const insertBuilder = {
      ...mockBuilder,
      select: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue({
          data: mockError ? null : (mockData || null),
          error: mockError || null,
        }),
        returns: jest.fn().mockResolvedValue({
          data: mockError ? null : (mockData || null),
          error: mockError || null,
        }),
      })),
    };
    return insertBuilder;
  });

  // For update operations
  mockBuilder.update.mockImplementation(() => ({
    ...mockBuilder,
    eq: jest.fn().mockReturnValue({
      ...mockBuilder,
      select: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue({
          data: mockError ? null : (mockData || null),
          error: mockError || null,
        }),
        returns: jest.fn().mockResolvedValue({
          data: mockError ? null : (mockData || null),
          error: mockError || null,
        }),
      })),
    }),
  }));

  return mockBuilder;
}

/**
 * Creates a mock Supabase client
 */
export function createMockSupabaseClient(defaultMockData?: any, defaultMockError?: any): MockSupabaseClient {
  const mockClient: MockSupabaseClient = {
    from: jest.fn(),
  };

  // Default behavior - return a query builder
  mockClient.from.mockImplementation(() => {
    return createMockQueryBuilder(defaultMockData, defaultMockError);
  });

  return mockClient;
}

/**
 * Creates a mock for specific table operations
 */
export function createTableMock(tableName: string, mockData?: any, mockError?: any) {
  const mockBuilder = createMockQueryBuilder(mockData, mockError);
  
  return {
    [tableName]: mockBuilder,
  };
}

/**
 * Utility to setup Supabase mock for specific operations
 */
export function setupSupabaseMock(operations: Record<string, { data?: any; error?: any }>) {
  const mockClient = createMockSupabaseClient();
  
  Object.entries(operations).forEach(([tableName, response]) => {
    when(mockClient.from).calledWith(tableName).mockReturnValue(
      createMockQueryBuilder(response.data, response.error)
    );
  });
  
  return mockClient;
}

// Helper function for conditional mocking (if jest-when is available)
function when(mockFn: jest.MockedFunction<any>) {
  return {
    calledWith: (arg: any) => ({
      mockReturnValue: (value: any) => {
        mockFn.mockImplementation((callArg) => {
          if (callArg === arg) {
            return value;
          }
          return createMockQueryBuilder();
        });
      },
    }),
  };
}

export const createMockSupabase = () => {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockUpsert = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockNeq = jest.fn();
  const mockGte = jest.fn();
  const mockLte = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockSingle = jest.fn();
  const mockMaybeSingle = jest.fn();
  const mockOr = jest.fn();
  const mockReturns = jest.fn();
  const mockRpc = jest.fn();
  const mockSql = jest.fn();

  // Create chainable mock methods
  const createChainableMock = () => {
    const chainable = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
      delete: mockDelete,
      eq: mockEq,
      neq: mockNeq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      or: mockOr,
      returns: mockReturns,
    };

    // Set up chaining for all methods to return the chainable object
    Object.keys(chainable).forEach(key => {
      if (key !== 'single' && key !== 'maybeSingle' && key !== 'returns') {
        chainable[key] = jest.fn().mockReturnValue(chainable);
      }
    });

    // Terminal methods should return a promise
    chainable.single = jest.fn().mockResolvedValue({ data: null, error: null });
    chainable.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    chainable.returns = jest.fn().mockResolvedValue({ data: null, error: null });

    return chainable;
  };

  // Setup the main mock object
  const mockSupabase = {
    from: mockFrom.mockImplementation(() => createChainableMock()),
    rpc: mockRpc.mockResolvedValue({ data: null, error: null }),
    sql: mockSql.mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };

  // Expose individual methods for easier testing
  return {
    mockSupabase,
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockUpsert,
    mockDelete,
    mockEq,
    mockNeq,
    mockGte,
    mockLte,
    mockOrder,
    mockLimit,
    mockSingle,
    mockMaybeSingle,
    mockOr,
    mockReturns,
    mockRpc,
    mockSql,
    resetMocks: () => {
      jest.clearAllMocks();
      mockFrom.mockImplementation(() => createChainableMock());
      mockRpc.mockResolvedValue({ data: null, error: null });
      mockSql.mockResolvedValue({ data: null, error: null });
    },
  };
};

// Export a default mock for convenience
export const mockSupabaseInstance = createMockSupabase();

// Mock for @supabase/supabase-js module
export const createClientMock = jest.fn(() => mockSupabaseInstance.mockSupabase);
