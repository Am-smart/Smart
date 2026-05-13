export const dbUtils = {
  /**
   * Prepares upsert data with version increment and updated_at
   */
  prepareUpsert<T extends { version?: number; id?: string }>(
    entity: Partial<T>,
    excludeFields: string[] = []
  ): Partial<T> & { updated_at: string; version: number } {
    const { version, id, ...rest } = entity as Record<string, unknown>;

    // Filter out excluded fields (like joined relations)
    const cleanedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (!excludeFields.includes(key)) {
        cleanedData[key] = value;
      }
    }

    return {
      ...cleanedData,
      ...(id ? { id } : {}),
      updated_at: new Date().toISOString(),
      version: (Number(version) || 0) + 1
    } as Partial<T> & { updated_at: string; version: number };
  },

  /**
   * Applies optimistic concurrency control (version check) to a query
   */
  applyVersionCheck<Q extends { eq: (column: string, value: string | number) => Q }>(
    query: Q,
    id?: string,
    version?: number
  ): Q {
    if (id && version !== undefined) {
      return query.eq('id', id).eq('version', version);
    }
    return query;
  },

  /**
   * Handles common database errors and converts them to standardized error messages.
   */
  handleUpsertError(error: { code: string; message: string } | null, entityName: string, id?: string, version?: number): never {
    if (!error) throw new Error('Unknown database error');

    // PGRST116 is Supabase/PostgREST code for "JSON object requested, but no rows returned"
    // often caused by our .eq('version', oldVersion) check failing.
    if (id && version !== undefined && (error.code === 'PGRST116' || error.message?.includes('concurrency'))) {
      throw new Error(`Conflict detected: ${entityName} has been updated by another user.`);
    } else {
      throw new Error(error.message || 'Database operation failed');
    }
  },

  /**
   * Generic upsert handler with version checking and standardized error handling.
   */
  async upsert<T extends { id?: string; version?: number }>(
    table: any,
    entity: Partial<T>,
    entityName: string,
    sessionId: string,
    options: { onConflict?: string; excludeFields?: string[] } = {}
  ): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSession } = require('../supabase');
    const upsertData = this.prepareUpsert(entity as unknown as { version?: number; id?: string }, options.excludeFields);

    const upsertOptions: { onConflict?: string } = {};
    if (!entity.id && options.onConflict) {
      upsertOptions.onConflict = options.onConflict;
    }

    let query = withSession(table, sessionId).upsert(upsertData, upsertOptions);

    const entityWithVersion = entity as { id?: string; version?: number };
    query = this.applyVersionCheck(query, entityWithVersion.id, entityWithVersion.version);

    const { data, error } = await query.select().single();

    if (error) {
      this.handleUpsertError(error, entityName, entityWithVersion.id, entityWithVersion.version);
    }

    return data as T;
  },

  /**
   * Applies common pagination and filtering to a Supabase query
   */
  applyPagination<Q extends { limit: (n: number) => Q; range: (from: number, to: number) => Q }>(
    query: Q,
    options: { limit?: number; offset?: number } = {}
  ): Q {
    let q = query;
    if (options.limit) {
        q = q.limit(options.limit);
    }
    if (options.offset !== undefined) {
        const limit = options.limit || 10;
        q = q.range(options.offset, options.offset + limit - 1);
    }
    return q;
  },

  /**
   * Standardized error handling for database operations
   */
  handleError(error: { message: string } | null | unknown): never {
    if (error && typeof error === 'object' && 'message' in error) {
        throw new Error((error as { message: string }).message || 'Database operation failed');
    } else {
        throw new Error('Unknown database error');
    }
  }
};
