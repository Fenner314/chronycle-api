export interface ReplayRequestResponse<T = any> {
  statusCode: number;
  headers: Record<string, any>;
  body: T;
  duration: number;
  originalRequest: {
    id: string;
    method: string;
    endpoint: string;
    timestamp: Date;
    duration: number;
  };
  replayTimestamp: string;
}
