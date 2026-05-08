import { withSession, supabase } from '../supabase';
import { User, LiveClass, Notification, Broadcast, Discussion, PlannerItem, Maintenance, Setting, SystemLog } from '../types';
import { dbUtils } from './db-utils';

export const systemDb = {
  // User Operations
  async findUserById(id: string, sessionId?: string): Promise<User | null> {
    const query = withSession(supabase.from('users').select('*').eq('id', id).single(), sessionId);
    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') return null;
      dbUtils.handleError(error);
    }
    return data as User;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      dbUtils.handleError(error);
    }
    return data as User;
  },

  async findAllUsers(sessionId: string): Promise<User[]> {
    const { data, error } = await withSession(supabase.from('users').select('*'), sessionId);
    if (error) dbUtils.handleError(error);
    return data as User[];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase.from('users').insert(userData).select().single();
    if (error) dbUtils.handleError(error);
    return data as User;
  },

  async updateUser(id: string, updates: Partial<User>, sessionId: string, version?: number): Promise<User> {
    const upsertData = dbUtils.prepareUpsert({ ...updates, id, version });
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('users'), sessionId).update(upsertData as Record<string, unknown>).eq('id', id),
      id,
      version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'User profile', id, version);
    return data as User;
  },

  async deleteUser(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('users'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  async updateUserFailedAttempts(id: string, attempts: number): Promise<void> {
    const { error } = await supabase.from('users').update({ failed_attempts: attempts }).eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  async lockUser(id: string, lockedUntil: string): Promise<void> {
    const { error } = await supabase.from('users').update({ locked_until: lockedUntil }).eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  async updateUserLastLogin(id: string): Promise<void> {
    const { error } = await supabase.from('users').update({
        last_login: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null
    }).eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Live Class Operations
  async findLiveClassById(id: string, sessionId: string): Promise<LiveClass | null> {
    const { data, error } = await withSession(supabase.from('live_classes').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as LiveClass;
  },

  async findAllLiveClasses(courseId?: string, teacherId?: string, sessionId?: string): Promise<LiveClass[]> {
    let query = withSession(supabase.from('live_classes').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as LiveClass[];
  },

  async upsertLiveClass(liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    const upsertData = dbUtils.prepareUpsert(liveClass, ['courses']);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('live_classes'), sessionId).upsert(upsertData as Record<string, unknown>),
      liveClass.id,
      liveClass.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Live class', liveClass.id, liveClass.version);
    return data as LiveClass;
  },

  async deleteLiveClass(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('live_classes'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Attendance Operations
  async upsertAttendance(attendance: { live_class_id: string, student_id: string, join_time: string, is_present: boolean }, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('attendance'), sessionId).upsert(attendance, { onConflict: 'live_class_id,student_id' });
    if (error) dbUtils.handleError(error);
  },

  // Notification Operations
  async findNotificationsByUserId(userId: string, sessionId: string): Promise<Notification[]> {
    const { data, error } = await withSession(supabase.from('notifications'), sessionId)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) dbUtils.handleError(error);
    return data as Notification[];
  },

  async markNotificationAsRead(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId).update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async updateNotification(id: string, updates: Partial<Notification>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId).update(updates).eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  async updateMultipleNotifications(ids: string[], updates: Partial<Notification>, sessionId: string): Promise<void> {
      const { error } = await withSession(supabase.from('notifications'), sessionId)
        .update(updates)
        .in('id', ids);
      if (error) dbUtils.handleError(error);
  }

  async updateNotificationsForUser(userId: string, updates: Partial<Notification>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId)
      .update(updates)
      .eq('user_id', userId);
    if (error) dbUtils.handleError(error);
  },

  async markAllNotificationsAsRead(userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async createNotification(target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string, sessionId?: string): Promise<void> {
    let query = supabase.rpc('notify_user', { target_id, n_title, n_msg, n_link, n_type });
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async broadcastToUsers(params: { n_course_id: string, n_role?: string, n_title: string, n_msg: string, n_link?: string, n_type?: string, n_expires_in?: string }, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.rpc('broadcast_data', params), sessionId);
    if (error) dbUtils.handleError(error);
  },

  // Broadcast Operations (Table-based)
  async createBroadcast(broadcast: Partial<Broadcast>, sessionId: string): Promise<Broadcast> {
    const { data, error } = await withSession(supabase.from('broadcasts'), sessionId).insert([broadcast]).select().single();
    if (error) dbUtils.handleError(error);
    return data as Broadcast;
  },

  async findAllBroadcasts(sessionId: string): Promise<Broadcast[]> {
    const { data, error } = await withSession(supabase.from('broadcasts'), sessionId).select('*').order('created_at', { ascending: false });
    if (error) dbUtils.handleError(error);
    return data as Broadcast[];
  },

  // Discussion Operations
  async findDiscussionsByCourseId(courseId: string, sessionId: string): Promise<Discussion[]> {
    const { data, error } = await withSession(supabase.from('discussions'), sessionId)
      .select('*, users!user_id(full_name, email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    if (error) dbUtils.handleError(error);
    return data as Discussion[];
  },

  async upsertDiscussion(post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    const upsertData = dbUtils.prepareUpsert(post, ['users']);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('discussions'), sessionId).upsert(upsertData as Record<string, unknown>),
      post.id,
      post.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Discussion post', post.id, post.version);
    return data as Discussion;
  },

  async deleteDiscussion(id: string, userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('discussions'), sessionId).delete().eq('id', id).eq('user_id', userId);
    if (error) dbUtils.handleError(error);
  },

  // Planner Operations
  async findPlannerItemsByUserId(userId: string, sessionId: string): Promise<PlannerItem[]> {
    const { data, error } = await withSession(supabase.from('planner'), sessionId).select('*').eq('user_id', userId);
    if (error) dbUtils.handleError(error);
    return data as PlannerItem[];
  },

  async upsertPlannerItem(item: Partial<PlannerItem>, sessionId: string): Promise<PlannerItem> {
    const upsertData = dbUtils.prepareUpsert(item);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('planner'), sessionId).upsert(upsertData as Record<string, unknown>),
      item.id,
      item.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Planner item', item.id, item.version);
    return data as PlannerItem;
  },

  async deletePlannerItem(id: string, userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('planner'), sessionId).delete().eq('id', id).eq('user_id', userId);
    if (error) dbUtils.handleError(error);
  },

  // Maintenance Operations
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    let query = supabase.from('maintenance').select('*');
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') dbUtils.handleError(error);
    return data as Maintenance || { enabled: false, schedules: [] };
  },

  async updateMaintenance(maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('maintenance'), sessionId).update(maintenance).eq('id', maintenance.id);
    if (error) dbUtils.handleError(error);
  },

  // Setting Operations
  async findAllSettings(sessionId: string): Promise<Setting[]> {
    const { data, error } = await withSession(supabase.from('settings'), sessionId).select('*');
    if (error) dbUtils.handleError(error);
    return data as Setting[];
  },

  async updateSetting(key: string, value: unknown, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.rpc('update_setting', { p_key: key, p_value: value }), sessionId);
    if (error) dbUtils.handleError(error);
  },

  // System Log Operations
  async createSystemLog(log: SystemLog, sessionId?: string): Promise<boolean> {
    const query = supabase.from('system_logs').insert(log);
    const { error } = sessionId ? await withSession(query, sessionId) : await query;
    if (error) {
      console.error('Failed to create system log:', error);
      return false;
    }
    return true;
  },

  async findAllSystemLogs(
    limit = 100,
    sessionId: string,
    filters: { user_id?: string; course_id?: string; resource_id?: string; category?: string; course_ids?: string[] } = {}
  ): Promise<SystemLog[]> {
    // Robust manual join to avoid "relationship not found" schema errors
    let query = withSession(supabase.from('system_logs'), sessionId)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
    if (filters.course_ids && filters.course_ids.length > 0) {
      query = query.in('course_id', filters.course_ids);
    }

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);

    const logs = data as SystemLog[];
    const userIds = [...new Set(logs.map(l => l.user_id).filter(id => !!id))] as string[];

    if (userIds.length > 0) {
      const { data: userData, error: userError } = await withSession(
        supabase.from('users').select('id, full_name, email'),
        sessionId
      ).in('id', userIds);

      if (!userError && userData) {
        const userMap = new Map(userData.map(u => [u.id, u]));
        return logs.map(log => ({
          ...log,
          users: log.user_id ? userMap.get(log.user_id) as { full_name: string; email: string } : undefined
        }));
      }
    }

    return logs;
  },

  async deleteSystemLogs(
    sessionId: string,
    filters: { course_id?: string; resource_id?: string; category?: string; before?: string } = {}
  ): Promise<void> {
    let query = withSession(supabase.from('system_logs'), sessionId).delete();

    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.before) query = query.lte('created_at', filters.before);

    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async updateSystemLog(id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    const { data, error } = await withSession(supabase.from('system_logs'), sessionId).update(updates).eq('id', id).select().single();
    if (error) dbUtils.handleError(error);
    return data as SystemLog;
  },

  async getSystemStats(sessionId?: string): Promise<Record<string, number>> {
    let usersQuery = supabase.from('users').select('*', { count: 'exact', head: true });
    let coursesQuery = supabase.from('courses').select('*', { count: 'exact', head: true });
    let enrollmentsQuery = supabase.from('enrollments').select('*', { count: 'exact', head: true });
    let submissionsQuery = supabase.from('submissions').select('*', { count: 'exact', head: true });

    if (sessionId) {
        usersQuery = withSession(usersQuery, sessionId);
        coursesQuery = withSession(coursesQuery, sessionId);
        enrollmentsQuery = withSession(enrollmentsQuery, sessionId);
        submissionsQuery = withSession(submissionsQuery, sessionId);
    }

    const [users, courses, enrollments, submissions] = await Promise.all([
        usersQuery,
        coursesQuery,
        enrollmentsQuery,
        submissionsQuery
    ]);

    return {
        users: users.count || 0,
        courses: courses.count || 0,
        enrollments: enrollments.count || 0,
        submissions: submissions.count || 0
    };
  },

  async getHealthMetrics(sessionId?: string): Promise<unknown> {
    // Basic health check for multiple systems
    const startTime = Date.now();
    let dbStatus = 'healthy';
    try {
        let query = supabase.from('settings').select('count', { count: 'exact', head: true });
        if (sessionId) query = withSession(query, sessionId);
        const { error } = await query;
        if (error) dbStatus = 'degraded';
    } catch {
        dbStatus = 'unhealthy';
    }

    return {
        status: dbStatus === 'healthy' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        services: {
            database: dbStatus,
            auth: 'healthy', // Simplified
            storage: 'healthy' // Simplified
        }
    };
  }
};
