'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, TrendingUp, Calendar, Dumbbell, Clock, Zap, Activity, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, subDays } from 'date-fns';
import { apiClient } from '@/lib/api/client';
import type { Workout, CreateWorkoutInput } from '@/types';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    exercises: '',
    duration: '',
    caloriesBurned: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    calculateStreak();
  }, [workouts]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.workouts.getAll();
      setWorkouts(response.data);
    } catch (error: unknown) {
      console.error('Failed to fetch workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = () => {
    if (workouts.length === 0) {
      setStreak(0);
      return;
    }

    const sortedWorkouts = [...workouts].sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const hasWorkoutOnDate = (date: Date) => {
      return sortedWorkouts.some((workout: any) => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === date.getTime();
      });
    };

    if (!hasWorkoutOnDate(checkDate)) {
      checkDate = subDays(checkDate, 1);
    }

    while (hasWorkoutOnDate(checkDate)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    setStreak(currentStreak);
  };

  const handleAddWorkout = async () => {
    try {
      const workoutData: CreateWorkoutInput = {
        name: formData.name,
        exercises: formData.exercises,
        duration: formData.duration ? Number(formData.duration) : undefined,
        caloriesBurned: formData.caloriesBurned ? Number(formData.caloriesBurned) : undefined,
        date: formData.date
      };

      const response = await apiClient.workouts.create(workoutData);
      setWorkouts(prev => [response.data, ...prev]);
      setShowAddModal(false);
      setFormData({
        name: '',
        exercises: '',
        duration: '',
        caloriesBurned: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: unknown) {
      console.error('Failed to add workout:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await apiClient.workouts.delete(id);
      setWorkouts(prev => prev.filter((w: any) => w.id !== id));
    } catch (error: unknown) {
      console.error('Failed to delete workout:', error instanceof Error ? error.message : String(error));
    }
  };

  const todayWorkouts = workouts.filter((w: any) => isToday(new Date(w.date)));
  const todayCalories = todayWorkouts.reduce((sum: any, w: any) => sum + (w.caloriesBurned || 0), 0);
  const todayMinutes = todayWorkouts.reduce((sum: any, w: any) => sum + (w.duration || 0), 0);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyWorkouts = workouts.filter((w: any) => {
    const workoutDate = new Date(w.date);
    return workoutDate >= weekStart && workoutDate <= weekEnd;
  });

  const weeklyCalories = weeklyWorkouts.reduce((sum: any, w: any) => sum + (w.caloriesBurned || 0), 0);
  const weeklyMinutes = weeklyWorkouts.reduce((sum: any, w: any) => sum + (w.duration || 0), 0);

  const recentWorkouts = [...workouts]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const groupedWorkouts = recentWorkouts.reduce((acc: any, workout: any) => {
    const dateKey = workout.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400">Loading your workouts...</p>
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <Dumbbell className="w-12 h-12 text-emerald-400" />
            </div>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-3">Start Your Fitness Journey</h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-md">
            Track your workouts, monitor your progress, and reach your fitness goals.
          </p>
          
          <Button
            onClick={() => setShowAddModal(true)}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Plus className="w-5 h-5" />
            Log Your First Workout
          </Button>
        </div>

        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Log Workout"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Workout Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, name: e.target.value as any })}
                placeholder="Morning Run, Leg Day, etc."
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Exercises
              </label>
              <textarea
                value={formData.exercises}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, exercises: e.target.value as any })}
                placeholder="Squats, Bench Press, Pull-ups..."
                rows={3}
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, duration: e.target.value as any })}
                  placeholder="45"
                  className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  value={formData.caloriesBurned}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, caloriesBurned: e.target.value as any })}
                  placeholder="300"
                  className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, date: e.target.value as any })}
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddWorkout}
                disabled={!formData.name || !formData.exercises}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Log Workout
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Your Fitness Dashboard</h1>
          <p className="text-zinc-400">Track your progress and stay motivated</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="w-5 h-5" />
          Log Workout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Today's Activity</h2>
              <p className="text-emerald-100">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="text-sm text-emerald-100">Workouts</div>
              <div className="text-3xl font-bold">{todayWorkouts.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-emerald-100">Calories Burned</div>
                  <div className="text-2xl font-bold">{todayCalories}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-emerald-100">Total Minutes</div>
                  <div className="text-2xl font-bold">{todayMinutes}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#12121a] border border-[#1a1a24] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Current Streak</div>
              <div className="text-3xl font-bold text-white">{streak} days</div>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            {streak > 0 ? 'Keep it up! Stay consistent.' : 'Start your streak today!'}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#12121a] border border-[#1a1a24] rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Weekly Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a24] rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Workouts</div>
            <div className="text-2xl font-bold text-white">{weeklyWorkouts.length}</div>
          </div>
          <div className="bg-[#1a1a24] rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Calories</div>
            <div className="text-2xl font-bold text-emerald-400">{weeklyCalories}</div>
          </div>
          <div className="bg-[#1a1a24] rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Minutes</div>
            <div className="text-2xl font-bold text-white">{weeklyMinutes}</div>
          </div>
          <div className="bg-[#1a1a24] rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Avg per Day</div>
            <div className="text-2xl font-bold text-white">{Math.round(weeklyMinutes / 7)}</div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day: any) => {
            const dayWorkouts = workouts.filter((w: any) => isSameDay(new Date(w.date), day));
            const hasWorkout = dayWorkouts.length > 0;
            const dayCalories = dayWorkouts.reduce((sum: any, w: any) => sum + (w.caloriesBurned || 0), 0);
            
            return (
              <div key={day.toISOString()} className="text-center">
                <div className="text-xs text-zinc-500 mb-2">{format(day, 'EEE')}</div>
                <div
                  className={cn(
                    'w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all',
                    hasWorkout
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                      : 'bg-[#1a1a24] border border-[#2a2a3a]',
                    isToday(day) && 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#12121a]'
                  )}
                >
                  <div className={cn('text-lg font-bold', hasWorkout ? 'text-emerald-400' : 'text-zinc-600')}>
                    {format(day, 'd')}
                  </div>
                  {hasWorkout && (
                    <div className="text-xs text-emerald-400 mt-1">
                      {dayWorkouts.length}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#12121a] border border-[#1a1a24] rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Recent Workouts
        </h3>

        <div className="space-y-4">
          {Object.entries(groupedWorkouts).map(([dateKey, dayWorkouts]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <div className="text-sm font-medium text-zinc-400">
                  {isToday(new Date(dateKey)) 
                    ? 'Today' 
                    : format(new Date(dateKey), 'EEEE, MMM d')}
                </div>
              </div>

              <div className="space-y-2 ml-6">
                {dayWorkouts.map((workout: any) => (
                  <motion.div
                    key={workout.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#1a1a24] rounded-xl p-4 border border-[#2a2a3a] hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{workout.name}</h4>
                        <p className="text-sm text-zinc-400 line-clamp-2">{workout.exercises}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors ml-4"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {workout.duration && (
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          <span>{workout.duration} min</span>
                        </div>
                      )}
                      {workout.caloriesBurned && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Zap className="w-4 h-4" />
                          <span>{workout.caloriesBurned} cal</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Log Workout"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Workout Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, name: e.target.value as any })}
              placeholder="Morning Run, Leg Day, etc."
              className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Exercises
            </label>
            <textarea
              value={formData.exercises}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, exercises: e.target.value as any })}
              placeholder="Squats, Bench Press, Pull-ups..."
              rows={3}
              className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Duration (min)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, duration: e.target.value as any })}
                placeholder="45"
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Calories
              </label>
              <input
                type="number"
                value={formData.caloriesBurned}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, caloriesBurned: e.target.value as any })}
                placeholder="300"
                className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData({ ...formData, date: e.target.value as any })}
              className="w-full px-4 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowAddModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWorkout}
              disabled={!formData.name || !formData.exercises}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Log Workout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

