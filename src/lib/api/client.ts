/**
 * API Client
 * Axios-based API client with typed methods
 */

import axios from 'axios';
import { Workout, CreateWorkoutInput, UpdateWorkoutInput, ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth is handled by NextAuth.js cookies — no manual token management needed
// Cookies are automatically sent with same-origin requests

export const apiClient = {
  // Workout API
  workouts: {
    getAll: async (params?: { page?: number; limit?: number }) => {
      const response = await api.get<PaginatedResponse<Workout>>('/workouts', { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get<ApiResponse<Workout>>(`/workouts/${id}`);
      return response.data;
    },
    create: async (data: CreateWorkoutInput) => {
      const response = await api.post<ApiResponse<Workout>>('/workouts', data);
      return response.data;
    },
    update: async (id: string, data: UpdateWorkoutInput) => {
      const response = await api.put<ApiResponse<Workout>>(`/workouts/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/workouts/${id}`);
    },
  },
};

export default apiClient;