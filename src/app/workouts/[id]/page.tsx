'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Dumbbell, Calendar, Clock, Flame, Pencil, Trash2, ArrowLeft, X, Save } from 'lucide-react';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import type { Workout, UpdateWorkoutInput } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';

interface WorkoutDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const resolvedParams = React.use(params);
  const workoutId = resolvedParams.id;
  const router = useRouter();
  
  const { selectedWorkout, setSelectedWorkout, updateWorkout, removeWorkout, workoutLoading, setWorkoutLoading } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: selectedWorkout?.name ?? '',
    exercises: selectedWorkout?.exercises ?? '',
    duration: selectedWorkout?.duration ?? 0,
    caloriesBurned: selectedWorkout?.caloriesBurned ?? 0,
    date: selectedWorkout?.date ?? new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setWorkoutLoading(true);
        setError(null);
        const response = await apiClient.workouts.getById(workoutId);
        setSelectedWorkout(response.data);
        setEditForm({
          name: response.data.name,
          exercises: response.data.exercises,
          duration: response.data.duration ?? 0,
          caloriesBurned: response.data.caloriesBurned ?? 0,
          date: response.data.date
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to load workout';
        setError(message);
        console.error('Error fetching workout:', error);
      } finally {
        setWorkoutLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId, setSelectedWorkout, setWorkoutLoading]);

  const handleSaveEdit = async () => {
    if (!selectedWorkout) return;
    
    try {
      setError(null);
      const updates: UpdateWorkoutInput = {
        name: editForm.name ?? '',
        exercises: editForm.exercises,
        duration: Number(editForm.duration),
        caloriesBurned: Number(editForm.caloriesBurned),
        date: editForm.date
      };
      
      const response = await apiClient.workouts.update(selectedWorkout.id, updates);
      updateWorkout(selectedWorkout.id, response.data);
      setSelectedWorkout(response.data);
      setIsEditing(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update workout';
      setError(message);
      console.error('Error updating workout:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkout) return;
    
    try {
      setError(null);
      await apiClient.workouts.delete(selectedWorkout.id);
      removeWorkout(selectedWorkout.id);
      setShowDeleteModal(false);
      router.push('/workouts');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete workout';
      setError(message);
      console.error('Error deleting workout:', error);
    }
  };

  const handleCancelEdit = () => {
    if (selectedWorkout) {
      setEditForm({
        name: selectedWorkout.name,
        exercises: selectedWorkout.exercises,
        duration: selectedWorkout.duration ?? 0,
        caloriesBurned: selectedWorkout.caloriesBurned ?? 0,
        date: selectedWorkout.date
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (workoutLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading workout...</p>
        </motion.div>
      </div>
    );
  }

  if (!selectedWorkout) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Dumbbell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Workout Not Found</h2>
          <p className="text-zinc-400 mb-6">The workout you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/workouts')} variant="default">
            Back to Workouts
          </Button>
        </motion.div>
      </div>
    );
  }

  const formattedDate = new Date(selectedWorkout.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const exerciseList = selectedWorkout.exercises.split(',').map((ex: string) => ex.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/workouts')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Workouts
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{selectedWorkout.name}</h1>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
            
            {!isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="default"
                  size="default"
                  className="flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="default"
                  size="default"
                  className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Duration</p>
                <p className="text-2xl font-bold text-white">{selectedWorkout.duration ?? 0} min</p>
              </div>
            </div>
          </div>

          <div className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Calories Burned</p>
                <p className="text-2xl font-bold text-white">{selectedWorkout.caloriesBurned ?? 0} kcal</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6"
        >
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, name: e.target.value as any })}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g., Morning Strength Training"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Exercises (comma-separated)
                </label>
                <textarea
                  value={editForm.exercises ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, exercises: e.target.value as any })}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  placeholder="e.g., Bench Press 3x10, Squats 4x12, Deadlifts 3x8"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={editForm.duration ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    value={editForm.caloriesBurned ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, caloriesBurned: Number(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, date: e.target.value as any })}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1a1a24] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  variant="default"
                  size="default"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="default"
                  size="default"
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                Exercises
              </h2>
              
              {exerciseList.length > 0 ? (
                <ul className="space-y-3">
                  {exerciseList.map((exercise: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-3 p-4 bg-[#0a0a0f] rounded-lg border border-[#1a1a24]"
                    >
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-white flex-1">{exercise}</p>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400 text-center py-8">No exercises recorded</p>
              )}

              <div className="mt-8 pt-6 border-t border-[#1a1a24]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-400 mb-1">Created</p>
                    <p className="text-white">
                      {new Date(selectedWorkout.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 mb-1">Last Updated</p>
                    <p className="text-white">
                      {new Date(selectedWorkout.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workout"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-zinc-400">
            Are you sure you want to delete <span className="text-white font-semibold">"{selectedWorkout.name}"</span>? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={handleDelete}
              variant="default"
              size="default"
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
            >
              Delete Workout
            </Button>
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="default"
              size="default"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
