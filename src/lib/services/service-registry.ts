import { AuthService } from './auth.service';
import { LearningService } from './learning.service';
import { AssessmentService } from './assessment.service';
import { SystemService } from './system.service';
import { PushService } from './push.service';

class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, unknown> = new Map();

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  public get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      // Lazy-initialization attempt if not found
      if (typeof window === 'undefined') {
        console.warn(`Service ${name} not found in registry. Ensure it is registered in @/lib/services/index.ts`);
      }
      throw new Error(`Service ${name} not found in registry. Requested at: ${new Date().toISOString()}`);
    }
    return service as T;
  }

  // Convenience getters with type safety
  get authService(): AuthService { return this.get<AuthService>('authService'); }
  get learningService(): LearningService { return this.get<LearningService>('learningService'); }
  get assessmentService(): AssessmentService { return this.get<AssessmentService>('assessmentService'); }
  get systemService(): SystemService { return this.get<SystemService>('systemService'); }
  get pushService(): PushService { return this.get<PushService>('pushService'); }
}

export const serviceRegistry = ServiceRegistry.getInstance();
