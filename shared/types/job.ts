/**
 * Job and Task Types
 * For orchestrator and worker communication
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'price' | 'market' | 'news' | 'ensemble';

export interface ForecastJob {
  id: string;
  profileId: string;
  type: JobType;
  status: JobStatus;
  requestTime: string;
  startTime?: string;
  endTime?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  priority: number;
  metadata?: Record<string, any>;
}

export interface JobBundle {
  id: string;
  profileId: string;
  requestTime: string;
  jobs: ForecastJob[];
  status: JobStatus;
  createdAt: Date;
}

export interface JobResult<T = any> {
  jobId: string;
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  timestamp: string;
}
