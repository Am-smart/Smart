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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },

  /**
   * Applies optimistic concurrency control (version check) to a query
   */
  applyVersionCheck(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    id?: string,
    version?: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async upsert<T extends { id?: string; version?: number } | any>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any,
    entity: Partial<T>,
    entityName: string,
    sessionId: string,
    options: { onConflict?: string; excludeFields?: string[] } = {}
  ): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSession } = require('../supabase');
    const upsertData = this.prepareUpsert(entity, options.excludeFields);

    let query = withSession(table, sessionId).upsert(upsertData, {
      onConflict: options.onConflict
    });

    const entityWithVersion = entity as { id?: string; version?: number };
    query = this.applyVersionCheck(query, entityWithVersion.id, entityWithVersion.version);

    const { data, error } = await query.select().single();

    if (error) {
      this.handleUpsertError(error, entityName, entityWithVersion.id, entityWithVersion.version);
    }

    return data as T;
  }
};
