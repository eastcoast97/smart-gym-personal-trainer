/**
 * TypeScript type definitions
 * Auto-generated based on architecture
 */

export interface Workout {
  id: string;
  name: string;
  exercises: string;
  duration: number;
  caloriesBurned: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateWorkoutInput = Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWorkoutInput = Partial<CreateWorkoutInput>;

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}