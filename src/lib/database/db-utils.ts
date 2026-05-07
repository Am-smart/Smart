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
   * Handles common PostgREST error for optimistic concurrency failure (PGRST116)
   */
  handleUpsertError(error: { code: string; message: string }, entityName: string, id?: string, version?: number): never {
    if (id && version !== undefined && error.code === 'PGRST116') {
      throw new Error(`Conflict detected: ${entityName} has been updated by another user.`);
    }
    throw new Error(error.message);
  },

  /**
   * Generic upsert handler with version checking and standardized error handling.
   */
  async upsert<
    T extends { id?: string; version?: number },
    QB extends { upsert: (data: any, options?: { onConflict?: string }) => FB },
    FB extends { select: () => TB; eq: (column: string, value: string | number) => FB },
    TB extends { single: () => PromiseLike<{ data: unknown; error: { code: string; message: string } | null }> }
  >(
    table: QB,
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

    let query = withSession(table, sessionId).upsert(upsertData, upsertOptions) as unknown as FB;

    const entityWithVersion = entity as { id?: string; version?: number };
    query = this.applyVersionCheck(query, entityWithVersion.id, entityWithVersion.version);

    const result = await query.select().single();
    const { data, error } = result as { data: unknown; error: { code: string; message: string } | null };

    if (error) {
      this.handleUpsertError(error, entityName, entityWithVersion.id, entityWithVersion.version);
    }

    return data as T;
  }
};
