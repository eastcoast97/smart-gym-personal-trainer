'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Dumbbell, Clock, Flame, Calendar, Edit2, Trash2, X, Check, Filter } from 'lucide-react';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import type { Workout, CreateWorkoutInput, UpdateWorkoutInput } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { format, parseISO } from 'date-fns';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
}

export default function WorkoutsPage() {
  const { workouts, setWorkouts, addWorkout, updateWorkout, removeWorkout, workoutLoading, setWorkoutLoading } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateWorkoutInput>({
    name: '',
    exercises: '[]',
    duration: 0,
    caloriesBurned: 0,
    date: new Date().toISOString()
  });

  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    name: '',
    sets: 3,
    reps: 10,
    weight: undefined
  });

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setWorkoutLoading(true);
    setError(null);
    try {
      const response = await apiClient.workouts.getAll();
      setWorkouts(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to load workouts:', errorMessage);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const handleAddExercise = () => {
    if (!currentExercise.name.trim()) return;
    
    setExercisesList([...exercisesList, currentExercise]);
    setCurrentExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: undefined
    });
  };

  const handleRemoveExercise = (index: number) => {
    setExercisesList(exercisesList.filter((_: any, i: any) => i !== index));
  };

  const handleCreateWorkout = async () => {
    if (!formData.name.trim()) {
      setError('Workout name is required');
      return;
    }

    if (exercisesList.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    setWorkoutLoading(true);
    setError(null);
    try {
      const workoutData: CreateWorkoutInput = {
        ...formData,
        exercises: JSON.stringify(exercisesList),
        date: new Date(formData.date).toISOString()
      };

      const response = await apiClient.workouts.create(workoutData);
      addWorkout(response.data);
      setShowAddModal(false);
      resetForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to create workout:', errorMessage);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const handleEditClick = (workout: Workout) => {
    setSelectedWorkout(workout);
    setFormData({
      name: workout.name,
      exercises: workout.exercises,
      duration: workout.duration ?? 0,
      caloriesBurned: workout.caloriesBurned ?? 0,
      date: workout.date
    });

    try {
      const parsedExercises = JSON.parse(workout.exercises);
      setExercisesList(Array.isArray(parsedExercises) ? parsedExercises : []);
    } catch {
      setExercisesList([]);
    }

    setShowEditModal(true);
  };

  const handleUpdateWorkout = async () => {
    if (!selectedWorkout) return;

    if (!formData.name.trim()) {
      setError('Workout name is required');
      return;
    }

    if (exercisesList.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    setWorkoutLoading(true);
    setError(null);
    try {
      const updates: UpdateWorkoutInput = {
        ...formData,
        exercises: JSON.stringify(exercisesList),
        date: new Date(formData.date).toISOString()
      };

      const response = await apiClient.workouts.update(selectedWorkout.id, updates);
      updateWorkout(selectedWorkout.id, response.data);
      setShowEditModal(false);
      resetForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to update workout:', errorMessage);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const handleDeleteClick = (workout: Workout) => {
    setSelectedWorkout(workout);
    setShowDeleteModal(true);
  };

  const handleDeleteWorkout = async () => {
    if (!selectedWorkout) return;

    setWorkoutLoading(true);
    setError(null);
    try {
      await apiClient.workouts.delete(selectedWorkout.id);
      removeWorkout(selectedWorkout.id);
      setShowDeleteModal(false);
      setSelectedWorkout(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to delete workout:', errorMessage);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      exercises: '[]',
      duration: 0,
      caloriesBurned: 0,
      date: new Date().toISOString()
    });
    setExercisesList([]);
    setCurrentExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: undefined
    });
    setSelectedWorkout(null);
    setError(null);
  };

  const filteredWorkouts = workouts.filter((workout: any) => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.exercises.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;

    const workoutDate = parseISO(workout.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      return workoutDate >= today && workoutDate <= todayEnd;
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return workoutDate >= weekAgo;
    }

    if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return workoutDate >= monthAgo;
    }

    return true;
  });

  const totalDuration = filteredWorkouts.reduce((sum: any, w: any) => sum + (w.duration ?? 0), 0);
  const totalCalories = filteredWorkouts.reduce((sum: any, w: any) => sum + (w.caloriesBurned ?? 0), 0);
  const averageDuration = filteredWorkouts.length > 0 ? Math.round(totalDuration / filteredWorkouts.length) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Workouts
            </h1>
            <p className="text-zinc-400 mt-2">Track and manage your training sessions</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Workout
          </Button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-[#12121a] rounded-xl border border-[#1a1a24] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-zinc-400 text-sm">Total Workouts</span>
            </div>
            <p className="text-3xl font-bold text-white">{filteredWorkouts.length}</p>
          </div>

          <div className="bg-[#12121a] rounded-xl border border-[#1a1a24] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-zinc-400 text-sm">Avg Duration</span>
            </div>
            <p className="text-3xl font-bold text-white">{averageDuration} min</p>
          </div>

          <div className="bg-[#12121a] rounded-xl border border-[#1a1a24] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-zinc-400 text-sm">Total Calories</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalCalories.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#12121a] rounded-xl border border-[#1a1a24] p-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSearchTerm(e.target.value)}
                placeholder="Search workouts or exercises..."
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-zinc-500" />
              <select
                value={dateFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {workoutLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg mb-2">No workouts found</p>
              <p className="text-zinc-500 text-sm">
                {searchTerm || dateFilter !== 'all' ? 'Try adjusting your filters' : 'Start by adding your first workout'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredWorkouts.map((workout: any, index: number) => {
                  let exercises: Exercise[] = [];
                  try {
                    exercises = JSON.parse(workout.exercises);
                    if (!Array.isArray(exercises)) exercises = [];
                  } catch {
                    exercises = [];
                  }

                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#1a1a24] rounded-xl border border-[#2a2a34] p-5 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-white truncate">{workout.name}</h3>
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium">
                              {exercises.length} exercises
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">{format(parseISO(workout.date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{workout.duration ?? 0} minutes</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Flame className="w-4 h-4 text-orange-400" />
                              <span className="text-sm">{workout.caloriesBurned ?? 0} cal</span>
                            </div>
                          </div>

                          {exercises.length > 0 && (
                            <div className="space-y-2">
                              {exercises.map((exercise: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-sm">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="text-white font-medium">{exercise.name}</span>
                                  <span className="text-zinc-500">•</span>
                                  <span className="text-zinc-400">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.weight ? ` @ ${exercise.weight}kg` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 groupHover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(workout)}
                            className="p-2 hover:bg-[#2a2a34] rounded-lg transition-colors"
                            title="Edit workout"
                          >
                            <Edit2 className="w-4 h-4 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(workout)}
                            className="p-2 hover:bg-[#2a2a34] rounded-lg transition-colors"
                            title="Delete workout"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Workout"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Workout Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, name: e.target.value as any })}
              placeholder="e.g., Chest & Triceps Day"
              className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
              <input
                type="date"
                value={formData.date.split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Duration (min)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, duration: Number(e.target.value) })}
                placeholder="60"
                min="0"
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Calories</label>
              <input
                type="number"
                value={formData.caloriesBurned}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, caloriesBurned: Number(e.target.value) })}
                placeholder="350"
                min="0"
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="border-t border-[#2a2a34] pt-6">
            <label className="block text-sm font-medium text-zinc-400 mb-4">Exercises</label>

            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={currentExercise.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, name: e.target.value as any })}
                  placeholder="Exercise name"
                  className="sm:col-span-2 px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="number"
                  value={currentExercise.sets}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, sets: Number(e.target.value) })}
                  placeholder="Sets"
                  min="1"
                  className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="number"
                  value={currentExercise.reps}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, reps: Number(e.target.value) })}
                  placeholder="Reps"
                  min="1"
                  className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={currentExercise.weight ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, weight: e.target.value as any ? Number(e.target.value) : undefined })}
                  placeholder="Weight (kg) - optional"
                  min="0"
                  step="0.5"
                  className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <Button
                  onClick={handleAddExercise}
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </Button>
              </div>
            </div>

            {exercisesList.length > 0 && (
              <div className="space-y-2">
                {exercisesList.map((exercise: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg border border-[#2a2a34]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-white font-medium">{exercise.name}</p>
                        <p className="text-sm text-zinc-400">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight ? ` @ ${exercise.weight}kg` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(idx)}
                      className="p-2 hover:bg-[#2a2a34] rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              variant="outline"
              className="border-[#2a2a34] text-zinc-400 hover:bg-[#1a1a24]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkout}
              disabled={workoutLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              {workoutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Workout"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Workout Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, name: e.target.value as any })}
              placeholder="e.g., Chest & Triceps Day"
              className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
              <input
                type="date"
                value={formData.date.split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Duration (min)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, duration: Number(e.target.value) })}
                placeholder="60"
                min="0"
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Calories</label>
              <input
                type="number"
                value={formData.caloriesBurned}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, caloriesBurned: Number(e.target.value) })}
                placeholder="350"
                min="0"
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="border-t border-[#2a2a34] pt-6">
            <label className="block text-sm font-medium text-zinc-400 mb-4">Exercises</label>

            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={currentExercise.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, name: e.target.value as any })}
                  placeholder="Exercise name"
                  className="sm:col-span-2 px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="number"
                  value={currentExercise.sets}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, sets: Number(e.target.value) })}
                  placeholder="Sets"
                  min="1"
                  className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <input
                  type="number"
                  value={currentExercise.reps}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, reps: Number(e.target.value) })}
                  placeholder="Reps"
                  min="1"
                  className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={currentExercise.weight ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCurrentExercise({ ...currentExercise, weight: e.target.value as any ? Number(e.target.value) : undefined })}
                  placeholder="Weight (kg) - optional"
                  min="0"
                  step="0.5"
                  className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a34] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <Button
                  onClick={handleAddExercise}
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </Button>
              </div>
            </div>

            {exercisesList.length > 0 && (
              <div className="space-y-2">
                {exercisesList.map((exercise: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg border border-[#2a2a34]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-white font-medium">{exercise.name}</p>
                        <p className="text-sm text-zinc-400">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight ? ` @ ${exercise.weight}kg` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(idx)}
                      className="p-2 hover:bg-[#2a2a34] rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              variant="outline"
              className="border-[#2a2a34] text-zinc-400 hover:bg-[#1a1a24]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateWorkout}
              disabled={workoutLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              {workoutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedWorkout(null);
        }}
        title="Delete Workout"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-zinc-400">
            Are you sure you want to delete <span className="text-white font-semibold">{selectedWorkout?.name}</span>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedWorkout(null);
              }}
              variant="outline"
              className="border-[#2a2a34] text-zinc-400 hover:bg-[#1a1a24]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteWorkout}
              disabled={workoutLoading}
              className="bg-red-500 hover:bg-red-600 text-white gap-2"
            >
              {workoutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

