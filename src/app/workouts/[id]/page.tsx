'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit2, Trash2, Calendar, Clock, Flame, Dumbbell, Save, X } from 'lucide-react';
import { useStore } from '@/store';
import { apiClient } from '@/lib/api/client';
import type { Workout, UpdateWorkoutInput } from '@/types';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

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
    name: '',
    exercises: '',
    duration: 0,
    caloriesBurned: 0,
    date: ''
  });

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  useEffect(() => {
    if (selectedWorkout) {
      setEditForm({
        name: selectedWorkout.name ?? '',
        exercises: selectedWorkout.exercises ?? '',
        duration: selectedWorkout.duration ?? 0,
        caloriesBurned: selectedWorkout.caloriesBurned ?? 0,
        date: selectedWorkout.date ?? ''
      });
    }
  }, [selectedWorkout]);

  const loadWorkout = async () => {
    try {
      setWorkoutLoading(true);
      setError(null);
      const response = await apiClient.workouts.getById(workoutId);
      setSelectedWorkout(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to load workout:', error);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing && selectedWorkout) {
      setEditForm({
        name: selectedWorkout.name ?? '',
        exercises: selectedWorkout.exercises ?? '',
        duration: selectedWorkout.duration ?? 0,
        caloriesBurned: selectedWorkout.caloriesBurned ?? 0,
        date: selectedWorkout.date ?? ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!selectedWorkout) return;
    
    try {
      setWorkoutLoading(true);
      setError(null);
      
      const updateData: UpdateWorkoutInput = {
        name: editForm.name ?? '',
        exercises: editForm.exercises,
        duration: editForm.duration,
        caloriesBurned: editForm.caloriesBurned,
        date: editForm.date
      };
      
      const response = await apiClient.workouts.update(workoutId, updateData);
      updateWorkout(workoutId, response.data);
      setSelectedWorkout(response.data);
      setIsEditing(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to update workout:', error);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setWorkoutLoading(true);
      setError(null);
      await apiClient.workouts.delete(workoutId);
      removeWorkout(workoutId);
      router.push('/workouts');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('Failed to delete workout:', error);
      setWorkoutLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error: unknown) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error: unknown) {
      return '';
    }
  };

  if (workoutLoading && !selectedWorkout) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-zinc-400">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedWorkout) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Workout</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/workouts')} variant="default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedWorkout) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Workout Not Found</h2>
          <p className="text-zinc-400 mb-6">The workout you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/workouts')} variant="default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/workouts')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workouts
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, name: e.target.value as any })}
                  className="text-3xl font-bold bg-transparent border-b-2 border-emerald-500 focus:outline-none w-full max-w-2xl mb-2"
                  placeholder="Workout Name"
                />
              ) : (
                <h1 className="text-3xl font-bold mb-2">{selectedWorkout.name}</h1>
              )}
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedWorkout.date)}
                </span>
                <span>{formatTime(selectedWorkout.date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={workoutLoading}
                    variant="default"
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleEditToggle}
                    disabled={workoutLoading}
                    variant="default"
                    className="bg-zinc-700 hover:bg-zinc-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleEditToggle}
                    variant="default"
                    className="bg-zinc-700 hover:bg-zinc-600"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="default"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
          >
            <p className="text-red-500 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-zinc-400 text-sm">Duration</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editForm.duration ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                  className="text-2xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 w-24"
                  min="0"
                />
                <span className="text-zinc-400">min</span>
              </div>
            ) : (
              <p className="text-2xl font-bold">{selectedWorkout.duration || 0} <span className="text-lg text-zinc-400">min</span></p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-zinc-400 text-sm">Calories Burned</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editForm.caloriesBurned ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, caloriesBurned: Number(e.target.value) })}
                  className="text-2xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 w-24"
                  min="0"
                />
                <span className="text-zinc-400">kcal</span>
              </div>
            ) : (
              <p className="text-2xl font-bold">{selectedWorkout.caloriesBurned || 0} <span className="text-lg text-zinc-400">kcal</span></p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-zinc-400 text-sm">Workout Date</span>
            </div>
            {isEditing ? (
              <input
                type="date"
                value={editForm.date.split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm({ ...editForm, date: new Date(e.target.value).toISOString() })}
                className="text-lg font-semibold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 w-full"
              />
            ) : (
              <p className="text-lg font-semibold">{new Date(selectedWorkout.date).toLocaleDateString()}</p>
            )}
          </motion.div>
        </div>

        {/* Exercises Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#12121a] border border-[#1a1a24] rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold">Exercises</h2>
          </div>

          {isEditing ? (
            <textarea
              value={editForm.exercises ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, exercises: e.target.value as any })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[200px] resize-vertical"
              placeholder="Enter exercises (one per line or comma-separated)"
            />
          ) : (
            <div className="space-y-2">
              {selectedWorkout.exercises ? (
                selectedWorkout.exercises.split(/[,\n]/).map((exercise: string, index: number) => {
                  const trimmed = exercise.trim();
                  if (!trimmed) return null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-zinc-200">{trimmed}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-zinc-400 italic">No exercises listed</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center gap-6 text-sm text-zinc-500"
        >
          <span>Created: {new Date(selectedWorkout.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(selectedWorkout.updatedAt).toLocaleString()}</span>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Workout"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-zinc-400">
            Are you sure you want to delete <span className="text-white font-semibold">"{selectedWorkout.name}"</span>? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              disabled={workoutLoading}
              variant="default"
              className="bg-zinc-700 hover:bg-zinc-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={workoutLoading}
              variant="default"
              className="bg-red-500 hover:bg-red-600"
            >
              {workoutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
