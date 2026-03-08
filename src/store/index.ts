/**
 * Zustand Store
 * Global state management for smart-gym-personal-trainer
 */

import { create } from 'zustand';
import { Workout } from '@/types';

interface AppState {
  // Workout state
  workouts: Workout[];
  selectedWorkout: Workout | null;
  workoutLoading: boolean;

  // Workout actions
  setWorkouts: (workouts: Workout[]) => void;
  setSelectedWorkout: (workout: Workout | null) => void;
  setWorkoutLoading: (loading: boolean) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;

}

export const useStore = create<AppState>((set) => ({
  // Workout state
  workouts: [],
  selectedWorkout: null,
  workoutLoading: false,

  // Workout actions
  setWorkouts: (workouts) => set({ workouts }),
  setSelectedWorkout: (workout) => set({ selectedWorkout: workout }),
  setWorkoutLoading: (loading) => set({ workoutLoading: loading }),
  addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
  updateWorkout: (id, updates) => set((state) => ({
    workouts: state.workouts.map(item => item.id === id ? { ...item, ...updates } : item)
  })),
  removeWorkout: (id) => set((state) => ({
    workouts: state.workouts.filter(item => item.id !== id)
  })),

}));