import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

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
      version: (version || 0) + 1
    };
  },

  /**
   * Applies optimistic concurrency control (version check) to a query
   */
  applyVersionCheck<T, R>(
    query: PostgrestFilterBuilder<Record<string, unknown>, T, R>,
    id?: string,
    version?: number
  ): PostgrestFilterBuilder<Record<string, unknown>, T, R> {
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
  }
};
