import { supabase, withSession } from '../supabase';
import { Certificate } from '../types';

export class CertificateRepository {
  async findByUserId(userId: string, sessionId: string): Promise<Certificate[]> {
    const { data, error } = await withSession(supabase.from('certificates'), sessionId)
      .select('*, courses(title)')
      .eq('student_id', userId);

    if (error) throw new Error(error.message);
    return data as Certificate[];
  }

  async create(certificate: Partial<Certificate>, sessionId: string): Promise<Certificate> {
    const { data, error } = await withSession(supabase.from('certificates'), sessionId)
        .insert([{
            ...certificate,
            issued_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as Certificate;
  }
}
