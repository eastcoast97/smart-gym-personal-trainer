'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Dumbbell, Flame, TrendingUp, Calendar, Clock, Trash2, Edit2, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useStore } from '@/store';
import type { Workout, CreateWorkoutInput } from '@/types';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export default function DashboardPage() {
  const { workouts, setWorkouts, addWorkout, removeWorkout, updateWorkout } = useStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateWorkoutInput>({
    name: '',
    exercises: '',
    duration: 0,
    caloriesBurned: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [editFormData, setEditFormData] = useState<CreateWorkoutInput>({
    name: '',
    exercises: '',
    duration: 0,
    caloriesBurned: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Load workouts on mount
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.workouts.getAll();
        setWorkouts(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workouts');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, [setWorkouts]);

  // Calculate stats
  const todayWorkouts = workouts.filter((w: any) => isToday(new Date(w.date)));
  const todayCalories = todayWorkouts.reduce((sum: any, w: any) => sum + (w.caloriesBurned || 0), 0);
  const todayDuration = todayWorkouts.reduce((sum: any, w: any) => sum + (w.duration || 0), 0);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekWorkouts = workouts.filter((w: any) => 
    isWithinInterval(new Date(w.date), { start: weekStart, end: weekEnd })
  );
  const weekCalories = weekWorkouts.reduce((sum: any, w: any) => sum + (w.caloriesBurned || 0), 0);

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group workouts by date
  const groupedWorkouts = sortedWorkouts.reduce((acc: any, workout: any) => {
    const date = workout.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await apiClient.workouts.create({
        ...formData,
        duration: Number(formData.duration) || 0,
        caloriesBurned: Number(formData.caloriesBurned) || 0
      });
      addWorkout(response.data);
      setShowAddModal(false);
      setFormData({
        name: '',
        exercises: '',
        duration: 0,
        caloriesBurned: 0,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add workout');
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      setError(null);
      await apiClient.workouts.delete(id);
      removeWorkout(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout');
    }
  };

  const handleEditClick = (workout: Workout) => {
    setSelectedWorkout(workout);
    setEditFormData({
      name: workout.name,
      exercises: workout.exercises,
      duration: workout.duration || 0,
      caloriesBurned: workout.caloriesBurned || 0,
      date: workout.date
    });
    setShowEditModal(true);
  };

  const handleUpdateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkout) return;
    
    try {
      setError(null);
      const response = await apiClient.workouts.update(selectedWorkout.id, {
        ...editFormData,
        duration: Number(editFormData.duration) || 0,
        caloriesBurned: Number(editFormData.caloriesBurned) || 0
      });
      updateWorkout(selectedWorkout.id, response.data);
      setShowEditModal(false);
      setSelectedWorkout(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your workouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Smart Gym Tracker</h1>
          <p className="text-zinc-400">Track your workouts and reach your fitness goals</p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Today's Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Card - Today's Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Today's Progress</h2>
                <p className="text-sm text-zinc-400">{format(new Date(), 'EEEE, MMMM d')}</p>
              </div>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Workouts</p>
                <p className="text-3xl font-bold text-emerald-400">{todayWorkouts.length}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Calories</p>
                <p className="text-3xl font-bold text-emerald-400">{todayCalories}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400 mb-1">Minutes</p>
                <p className="text-3xl font-bold text-emerald-400">{todayDuration}</p>
              </div>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Log Workout
            </Button>
          </motion.div>

          {/* Weekly Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold">This Week</h3>
                <p className="text-sm text-zinc-400">Weekly summary</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Workouts</span>
                <span className="font-semibold text-emerald-400">{weekWorkouts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Calories Burned</span>
                <span className="font-semibold text-emerald-400">{weekCalories}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Avg per Day</span>
                <span className="font-semibold text-emerald-400">{Math.round(weekCalories / 7)}</span>
              </div>
            </div>

            {weekWorkouts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1a1a24]">
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-zinc-400">
                    Keep it up! {weekWorkouts.length} {weekWorkouts.length === 1 ? 'workout' : 'workouts'} this week
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Workouts</h2>
            <Activity className="w-5 h-5 text-zinc-400" />
          </div>

          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Your Fitness Journey</h3>
              <p className="text-zinc-400 mb-6">Log your first workout to begin tracking your progress</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Workout
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedWorkouts).map(([date, dateWorkouts]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-sm text-zinc-400">
                      {isToday(new Date(date)) 
                        ? 'Today' 
                        : format(new Date(date), 'EEEE, MMMM d')}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {dateWorkouts.map((workout: any) => (
                      <motion.div
                        key={workout.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#1a1a24] border border-emerald-500/10 rounded-lg p-4 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{workout.name}</h4>
                            <p className="text-sm text-zinc-400 mb-3">{workout.exercises}</p>
                            
                            <div className="flex flex-wrap gap-4">
                              {workout.duration && workout.duration > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-emerald-400" />
                                  <span className="text-zinc-300">{workout.duration} min</span>
                                </div>
                              )}
                              {workout.caloriesBurned && workout.caloriesBurned > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Flame className="w-4 h-4 text-orange-400" />
                                  <span className="text-zinc-300">{workout.caloriesBurned} cal</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditClick(workout)}
                              className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkout(workout.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
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
              <label className="block text-sm font-medium mb-2">Workout Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                  setFormData({ ...formData, name: e.target.value as any })
                }
                className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g., Morning Run, Chest Day"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Exercises</label>
              <textarea
                value={formData.exercises}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setFormData({ ...formData, exercises: e.target.value as any })
                }
                className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50 min-h-[80px]"
                placeholder="e.g., Bench Press 3x10, Squats 4x8"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (min)</label>
                <input
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                    setFormData({ ...formData, duration: Number(e.target.value) })
                  }
                  className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                  placeholder="30"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Calories</label>
                <input
                  type="number"
                  value={formData.caloriesBurned || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                    setFormData({ ...formData, caloriesBurned: Number(e.target.value) })
                  }
                  className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                  placeholder="200"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                  setFormData({ ...formData, date: e.target.value as any })
                }
                className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Save Workout
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Workout Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedWorkout(null);
          }}
          title="Edit Workout"
          size="md"
        >
          <form onSubmit={handleUpdateWorkout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Workout Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                  setEditFormData({ ...editFormData, name: e.target.value as any })
                }
                className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Exercises</label>
              <textarea
                value={editFormData.exercises}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setEditFormData({ ...editFormData, exercises: e.target.value as any })
                }
                className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50 min-h-[80px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration (min)</label>
                <input
                  type="number"
                  value={editFormData.duration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                    setEditFormData({ ...editFormData, duration: Number(e.target.value) })
                  }
                  className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Calories</label>
                <input
                  type="number"
                  value={editFormData.caloriesBurned || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                    setEditFormData({ ...editFormData, caloriesBurned: Number(e.target.value) })
                  }
                  className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={editFormData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
                  setEditFormData({ ...editFormData, date: e.target.value as any })
                }
                className="w-full bg-[#1a1a24] border border-emerald-500/20 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedWorkout(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Update Workout
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

