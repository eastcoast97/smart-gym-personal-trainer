'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Dumbbell, Clock, Flame, Calendar, Search, Filter, X, Edit2, Trash2, TrendingUp, Activity } from 'lucide-react';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import type { Workout, CreateWorkoutInput, UpdateWorkoutInput } from '@/types';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function WorkoutsPage() {
  const { workouts, setWorkouts, addWorkout, updateWorkout, removeWorkout, workoutLoading, setWorkoutLoading } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'calories'>('date');

  // Form state for add
  const [addForm, setAddForm] = useState({
    name: '',
    exercises: '',
    duration: '',
    caloriesBurned: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Form state for edit
  const [editForm, setEditForm] = useState({
    name: '',
    exercises: '',
    duration: '',
    caloriesBurned: '',
    date: ''
  });

  // Fetch workouts on mount
  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setWorkoutLoading(true);
      const response = await apiClient.workouts.getAll();
      setWorkouts(response.data);
    } catch (error: unknown) {
      console.error('Failed to fetch workouts:', error instanceof Error ? error.message : String(error));
    } finally {
      setWorkoutLoading(false);
    }
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const exercisesList = addForm.exercises.split(',').map((ex: any) => ex.trim()).filter(Boolean);
      
      const newWorkout: CreateWorkoutInput = {
        name: addForm.name ?? '',
        exercises: JSON.stringify(exercisesList.map((ex: any) => ({ name: ex, sets: 0, reps: 0 }))),
        duration: addForm.duration ? Number(addForm.duration) : undefined,
        caloriesBurned: addForm.caloriesBurned ? Number(addForm.caloriesBurned) : undefined,
        date: new Date(addForm.date).toISOString()
      };

      const response = await apiClient.workouts.create(newWorkout);
      addWorkout(response.data);
      setShowAddModal(false);
      setAddForm({
        name: '',
        exercises: '',
        duration: '',
        caloriesBurned: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: unknown) {
      console.error('Failed to create workout:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleEditWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkout) return;

    try {
      const exercisesList = editForm.exercises.split(',').map((ex: any) => ex.trim()).filter(Boolean);
      
      const updates: UpdateWorkoutInput = {
        name: editForm.name ?? '',
        exercises: JSON.stringify(exercisesList.map((ex: any) => ({ name: ex, sets: 0, reps: 0 }))),
        duration: editForm.duration ? Number(editForm.duration) : undefined,
        caloriesBurned: editForm.caloriesBurned ? Number(editForm.caloriesBurned) : undefined,
        date: new Date(editForm.date).toISOString()
      };

      const response = await apiClient.workouts.update(selectedWorkout.id, updates);
      updateWorkout(selectedWorkout.id, response.data);
      setShowEditModal(false);
      setSelectedWorkout(null);
    } catch (error: unknown) {
      console.error('Failed to update workout:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    try {
      await apiClient.workouts.delete(id);
      removeWorkout(id);
    } catch (error: unknown) {
      console.error('Failed to delete workout:', error instanceof Error ? error.message : String(error));
    }
  };

  const openEditModal = (workout: Workout) => {
    setSelectedWorkout(workout);
    let exercisesString = '';
    try {
      const parsed = JSON.parse(workout.exercises);
      if (Array.isArray(parsed)) {
        exercisesString = parsed.map((ex: any) => ex.name).join(', ');
      }
    } catch {
      exercisesString = workout.exercises;
    }

    setEditForm({
      name: workout.name ?? '',
      exercises: exercisesString,
      duration: workout.duration?.toString() ?? '',
      caloriesBurned: workout.caloriesBurned?.toString() ?? '',
      date: workout.date ? new Date(workout.date).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  // Filter and search workouts
  const filteredWorkouts = workouts.filter((workout: Workout) => {
    const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (dateFilter === 'all') return matchesSearch;
    
    const workoutDate = new Date(workout.date);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return matchesSearch && workoutDate.toDateString() === now.toDateString();
    }
    
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && workoutDate >= weekAgo;
    }
    
    if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return matchesSearch && workoutDate >= monthAgo;
    }
    
    return matchesSearch;
  }).sort((a: Workout, b: Workout) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'duration') {
      return (b.duration ?? 0) - (a.duration ?? 0);
    }
    if (sortBy === 'calories') {
      return (b.caloriesBurned ?? 0) - (a.caloriesBurned ?? 0);
    }
    return 0;
  });

  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum: number, w: Workout) => sum + (w.duration ?? 0), 0);
  const totalCalories = workouts.reduce((sum: number, w: Workout) => sum + (w.caloriesBurned ?? 0), 0);
  const avgCalories = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

  const getExercisesDisplay = (exercisesJson: string) => {
    try {
      const parsed = JSON.parse(exercisesJson);
      if (Array.isArray(parsed)) {
        return parsed.map((ex: any) => ex.name).join(', ');
      }
      return exercisesJson;
    } catch {
      return exercisesJson;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-[#1a1a24] bg-[#12121a]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Dumbbell className="w-8 h-8 text-emerald-400" />
                My Workouts
              </h1>
              <p className="text-zinc-400">Track your fitness journey</p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Log Workout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#12121a] border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Workouts</p>
                  <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
                </div>
                <Activity className="w-10 h-10 text-emerald-400 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#12121a] border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Time</p>
                  <p className="text-2xl font-bold text-white">{totalDuration}m</p>
                </div>
                <Clock className="w-10 h-10 text-emerald-400 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#12121a] border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Total Calories</p>
                  <p className="text-2xl font-bold text-white">{totalCalories}</p>
                </div>
                <Flame className="w-10 h-10 text-orange-400 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#12121a] border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Avg Calories</p>
                  <p className="text-2xl font-bold text-white">{avgCalories}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-400 opacity-50" />
              </div>
            </motion.div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setSearchQuery(e.target.value)}
                placeholder="Search workouts..."
                className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className={cn(
                "border-[#2a2a34] text-zinc-400 hover:text-white hover:border-emerald-500/50",
                showFilters && "border-emerald-500/50 text-emerald-400"
              )}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-[#1a1a24] border border-[#2a2a34] rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Time Period</label>
                      <select
                        value={dateFilter}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDateFilter(e.target.value)}
                        className="w-full bg-[#12121a] border border-[#2a2a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'date' | 'duration' | 'calories')}
                        className="w-full bg-[#12121a] border border-[#2a2a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="date">Date (Newest First)</option>
                        <option value="duration">Duration</option>
                        <option value="calories">Calories Burned</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Workouts List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {workoutLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-20">
            <Dumbbell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">
              {searchQuery || dateFilter !== 'all' ? 'No workouts found' : 'No workouts yet'}
            </h3>
            <p className="text-zinc-500 mb-6">
              {searchQuery || dateFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start tracking your fitness journey by logging your first workout'}
            </p>
            {!searchQuery && dateFilter === 'all' && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Log Your First Workout
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredWorkouts.map((workout: Workout, index: number) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#12121a] border border-[#1a1a24] hover:border-emerald-500/30 rounded-xl p-6 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{workout.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          {format(new Date(workout.date), 'MMM dd, yyyy')}
                        </div>
                        {workout.duration && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            {workout.duration} min
                          </div>
                        )}
                        {workout.caloriesBurned && (
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-orange-400" />
                            {workout.caloriesBurned} cal
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(workout)}
                        className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1a24] rounded-lg p-4 border border-[#2a2a34]">
                    <p className="text-sm text-zinc-400 mb-2">Exercises:</p>
                    <p className="text-white">{getExercisesDisplay(workout.exercises)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Workout Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log New Workout"
        size="md"
      >
        <form onSubmit={handleAddWorkout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Workout Name *
            </label>
            <input
              type="text"
              value={addForm.name ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAddForm({ ...addForm, name: e.target.value as any })}
              required
              placeholder="e.g., Morning Cardio, Leg Day"
              className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Exercises *
            </label>
            <input
              type="text"
              value={addForm.exercises ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAddForm({ ...addForm, exercises: e.target.value as any })}
              required
              placeholder="e.g., Running, Push-ups, Squats (comma separated)"
              className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">Separate exercises with commas</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={addForm.duration ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAddForm({ ...addForm, duration: e.target.value as any })}
                placeholder="30"
                min="0"
                className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Calories Burned
              </label>
              <input
                type="number"
                value={addForm.caloriesBurned ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAddForm({ ...addForm, caloriesBurned: e.target.value as any })}
                placeholder="250"
                min="0"
                className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={addForm.date ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAddForm({ ...addForm, date: e.target.value as any })}
              required
              className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowAddModal(false)}
              variant="outline"
              className="flex-1 border-[#2a2a34] text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Log Workout
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Workout Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Workout"
        size="md"
      >
        <form onSubmit={handleEditWorkout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Workout Name *
            </label>
            <input
              type="text"
              value={editForm.name ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, name: e.target.value as any })}
              required
              placeholder="e.g., Morning Cardio, Leg Day"
              className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Exercises *
            </label>
            <input
              type="text"
              value={editForm.exercises ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, exercises: e.target.value as any })}
              required
              placeholder="e.g., Running, Push-ups, Squats (comma separated)"
              className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-xs text-zinc-500 mt-1">Separate exercises with commas</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={editForm.duration ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, duration: e.target.value as any })}
                placeholder="30"
                min="0"
                className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Calories Burned
              </label>
              <input
                type="number"
                value={editForm.caloriesBurned ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, caloriesBurned: e.target.value as any })}
                placeholder="250"
                min="0"
                className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={editForm.date ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, date: e.target.value as any })}
              required
              className="w-full bg-[#1a1a24] border border-[#2a2a34] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowEditModal(false)}
              variant="outline"
              className="flex-1 border-[#2a2a34] text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
