import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pause, Play, RotateCcw, SkipForward, ArrowLeft, Clock, Target, Zap, CheckCircle, Timer, AlertCircle, Video, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPersonalizedWorkout, workoutTypes, type Workout } from "@/lib/workouts";
import { useAuth } from "@/contexts/AuthContext";
import ExerciseVideoModal from "@/components/ExerciseVideoModal";
import AnimatedExercise from "@/components/AnimatedExercise";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const parseSeconds = (text: string | undefined): number | null => {
  if (!text) return null;
  const m = text.match(/(\d+)\s*(seconds|second|sec|s)/i);
  if (m) return parseInt(m[1], 10);
  const mMin = text.match(/(\d+)\s*(minutes|minute|min|m)/i);
  if (mMin) return parseInt(mMin[1], 10) * 60;
  const repsRange = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(reps|rep|times)/i);
  if (repsRange) {
    const base = parseInt(repsRange[1], 10);
    return Math.max(10, Math.min(180, base * 3));
  }
  return null;
};

const WorkoutSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const [hasSavedCompletion, setHasSavedCompletion] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const workoutId = searchParams.get("workout");
  const typeParam = searchParams.get("type");
  const workoutTypeKey = typeParam && workoutTypes[typeParam] ? typeParam : undefined;

  // Derive workout either by id scan or by type/day fallback
  const workout: Workout | null = useMemo(() => {
    if (workoutId) {
      for (const key of Object.keys(workoutTypes)) {
        const found = workoutTypes[key].workouts.find((w) => w.id === workoutId);
        if (found) return found;
      }
    }
    const today = new Date().getDay();
    const typeKey = workoutTypeKey || "classic";
    return getPersonalizedWorkout(userProfile || null, typeKey, today);
  }, [workoutId, workoutTypeKey, userProfile]);

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRestPhase, setIsRestPhase] = useState(false);
  // Voice toggle state - use ref to preserve across transitions, sync with state for UI
  const voiceEnabledRef = useRef(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Sync ref with state whenever state changes (from user toggle)
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [completedSets, setCompletedSets] = useState<number>(0);
  const [skippedSets, setSkippedSets] = useState<number>(0);
  const [skippedExercisesInfo, setSkippedExercisesInfo] = useState<Array<{exerciseIndex: number, exerciseName: string, skippedSets: number}>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{name: string, videoUrl?: string, videoThumbnail?: string} | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isAdvancingRef = useRef(false);
  const lastAdvanceTsRef = useRef<number>(0);
  const restTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safe access to exercises - prevent runtime errors
  const exercises = workout?.exercises || [];
  const hasValidWorkout = workout && exercises.length > 0 && workout.id && workout.name;

  const currentExercise = exercises[exerciseIndex] || null;

  // Calculate total sets across all exercises (safe with empty array fallback)
  const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 1), 0);
  
  // Calculate workout progress based on completed sets (exclude skipped)
  // Progress = completedSets / totalSets * 100
  const workoutProgress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  
  // Calculate exercise progress within current exercise
  const currentExerciseProgress = currentExercise ? ((setIndex + 1) / (currentExercise.sets || 1)) * 100 : 0;
  
  // Get timer color based on time remaining
  const getTimerColor = () => {
    if (secondsLeft === null) return "text-gray-500";
    if (isRestPhase) return "text-blue-500";
    if (secondsLeft <= 10) return "text-red-500 animate-pulse";
    if (secondsLeft <= 30) return "text-orange-500";
    return "text-green-500";
  };

  // Get timer background color
  const getTimerBgColor = () => {
    if (secondsLeft === null) return "bg-gray-100";
    if (isRestPhase) return "bg-blue-50";
    if (secondsLeft <= 10) return "bg-red-50 animate-pulse";
    if (secondsLeft <= 30) return "bg-orange-50";
    return "bg-green-50";
  };

  const cancelSpeech = () => {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } catch (error) {
      // Speech synthesis not available or error occurred
      console.debug("Speech synthesis error:", error);
    }
  };

  const speak = useCallback((text: string) => {
    // Use ref to check voice state (preserved across transitions)
    if (!voiceEnabledRef.current || !text) return;
    try {
      cancelSpeech();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;
      
      u.onstart = () => {
        setIsSpeaking(true);
      };
      
      u.onend = () => {
        setIsSpeaking(false);
      };
      
      u.onerror = () => {
        setIsSpeaking(false);
      };
      
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (error) {
      // Speech synthesis not available or error occurred
      console.debug("Speech synthesis error:", error);
    }
  }, []);

  const tipsForExercise = (name?: string | null) => {
    const n = (name || "").toLowerCase();
    if (n.includes("jumping jacks")) return "Land softly, keep core engaged, and breathe steadily.";
    if (n.includes("push-up")) return "Keep a straight line from head to heels, elbows at 45 degrees.";
    if (n.includes("mountain climbers")) return "Drive knees towards chest, keep hips low and core tight.";
    if (n.includes("squat")) return "Chest up, sit back into heels, knees track over toes.";
    if (n.includes("plank")) return "Squeeze glutes, keep spine neutral, don’t let hips sag.";
    if (n.includes("burpee")) return "Move smoothly, protect lower back, and land softly.";
    if (n.includes("high knees")) return "Pump arms, lift knees to hip height, stay tall.";
    if (n.includes("row")) return "Pull with back, keep shoulders down and core braced.";
    if (n.includes("lunge")) return "Step long, front knee over ankle, torso upright.";
    if (n.includes("deadlift")) return "Hinge at hips, flat back, keep the bar close to body.";
    if (n.includes("bench press")) return "Shoulder blades retracted, feet planted, control the descent.";
    if (n.includes("goblet squat")) return "Elbows down, keep kettlebell close, sit deep with neutral spine.";
    return "Maintain good form and steady breathing.";
  };

  const secondsToSpeech = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const parts: string[] = [];
    if (m > 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
    if (s > 0) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`);
    return parts.join(" ");
  };

  // Clear timer utility - must be called before starting new timers
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Also clear any rest timer
    if (restTimerRef.current !== null) {
      clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    }
  }, []);

  // Initialize timer for the exercise or its rest when starting a set
  const startTimerForCurrent = useCallback(() => {
    if (!currentExercise) return;
    
    // CRITICAL: Clear any existing timer before starting new one
    clearTimer();
    
    // Set workout start time if not already set
    setWorkoutStartTime(prev => prev || new Date());
    
    // Prefer duration if present, else parse from reps; default to 45s
    const parsed = parseSeconds(currentExercise.duration || currentExercise.reps);
    const duration = parsed ?? 45;
    
    // Reset state and start timer
    setIsRestPhase(false);
    setSecondsLeft(duration);
    setIsRunning(true);
    
    // Speak only if voice is enabled (using ref which is synced with state)
    // Note: tipsForExercise and secondsToSpeech are pure functions, no dependencies needed
    const exerciseName = currentExercise.name;
    const durationText = secondsToSpeech(duration);
    const tip = tipsForExercise(exerciseName);
    speak(`Start ${exerciseName} for the next ${durationText}. ${tip}`);
  }, [currentExercise, clearTimer, speak]);

  // Timer tick - update every second when running
  useEffect(() => {
    // Clear any existing timer first
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Start new timer only if running and secondsLeft is valid
    if (isRunning && secondsLeft !== null && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s === null || s <= 0) {
            // Timer reached zero - clear interval
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    
    // Cleanup on unmount or when isRunning/secondsLeft changes
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, secondsLeft]);

  // Save workout completion function - defined early for use in endWorkout
  const saveWorkoutCompletionRef = useRef<() => Promise<void>>();
  
  const saveWorkoutCompletion = async () => {
    if (!workout || !user || hasSavedCompletion) return;
    
    try {
      setHasSavedCompletion(true);
      const now = new Date();
      const dateKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const workoutType = searchParams.get("type") || "classic";
      
      // Calculate duration
      let duration = workout.duration;
      if (workoutStartTime) {
        const elapsed = Math.round((now.getTime() - workoutStartTime.getTime()) / 1000 / 60);
        duration = `${elapsed} min`;
      }
      
      // Calculate progress metrics - ONLY from completedSets (rest and skipped sets excluded)
      const finalCompletedSets = completedSets;
      const finalSkippedSets = skippedSets;
      const finalTotalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 1), 0);
      // Progress = completedSets / totalSets * 100 (rest time and skipped sets do NOT count)
      const progressPercent = finalTotalSets > 0 ? Math.round((finalCompletedSets / finalTotalSets) * 100) : 0;
      // Workout is complete only if all sets are completed (not skipped)
      const isCompleted = finalCompletedSets === finalTotalSets;
      
      const saveData = {
        date: serverTimestamp(),
        dateKey,
        workoutType,
        workoutId: workout.id,
        duration,
        calories: workout.caloriesBurn,
        completed: isCompleted,
        totalExercises: exercises.length,
        totalSets: finalTotalSets,
        completedSets: finalCompletedSets,
        skippedSets: finalSkippedSets,
        progressPercent,
        skippedExercisesInfo: skippedExercisesInfo.length > 0 ? skippedExercisesInfo : undefined,
      };
      
      const ref = doc(db, "users", user.uid, "completions", dateKey);
      await setDoc(ref, saveData, { merge: true });
      
      // Log saved data for verification
      console.log("✅ Workout session saved to Firestore:", {
        dateKey,
        workoutType,
        workoutId: workout.id,
        duration,
        totalExercises: exercises.length,
        totalSets: finalTotalSets,
        completedSets: finalCompletedSets,
        skippedSets: finalSkippedSets,
        progressPercent,
        completed: isCompleted,
        skippedExercisesCount: skippedExercisesInfo.length,
        date: "serverTimestamp()",
      });
      
      toast({
        title: "Workout saved! 🎉",
        description: "Your progress has been recorded.",
      });
      
      // Show summary dialog after a brief delay to ensure state is updated
      setTimeout(() => {
        setShowSummary(true);
      }, 100);
    } catch (error) {
      console.error("Failed to save workout completion:", error);
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
      setHasSavedCompletion(false);
    }
  };
  
  // Store ref for use in endWorkout - update on each render
  useEffect(() => {
    saveWorkoutCompletionRef.current = saveWorkoutCompletion;
  }, [completedSets, skippedSets, skippedExercisesInfo, hasSavedCompletion]);
  
  // End workout - defined after saveWorkoutCompletion
  const endWorkout = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
    setIsRestPhase(false);
    isAdvancingRef.current = false;
    cancelSpeech();
    speak("Workout complete. Great job! Remember to cool down and hydrate.");
    
    // Auto-save completion to Firestore
    if (workout && user && !hasSavedCompletion && saveWorkoutCompletionRef.current) {
      saveWorkoutCompletionRef.current();
    }
  }, [workout, user, hasSavedCompletion]);
  
  // Handle next exercise - transitions to next exercise and starts timer
  const handleNextExercise = useCallback(() => {
    if (!workout) return;
    
    const currentExerciseIndex = exerciseIndex;
    
    if (currentExerciseIndex + 1 < exercises.length) {
      // Move to next exercise
      setIsRestPhase(false);
      setIsRunning(false);
      setExerciseIndex(currentExerciseIndex + 1);
      setSetIndex(0);
      
      // Start next exercise timer
      setTimeout(() => {
        startTimerForCurrent();
      }, 50);
    } else {
      // All exercises done - end workout
      clearTimer();
      endWorkout();
    }
  }, [workout, exercises, exerciseIndex, clearTimer, startTimerForCurrent, endWorkout]);
  
  // Handle next set or exercise transition - called after rest timer ends
  const handleNextSetOrExercise = useCallback(() => {
    if (!currentExercise || !workout) return;
    
    // Debounce to prevent rapid calls
    const now = Date.now();
    if (now - lastAdvanceTsRef.current < 500) return;
    lastAdvanceTsRef.current = now;
    
    const totalSetsForExercise = currentExercise.sets || 1;
    const currentSetIndex = setIndex;
    
    // Check if more sets in current exercise
    if (currentSetIndex + 1 < totalSetsForExercise) {
      // Move to next set
      setIsRestPhase(false);
      setIsRunning(false);
      setSetIndex(currentSetIndex + 1);
      
      // Start next set timer
      setTimeout(() => {
        startTimerForCurrent();
      }, 50);
    } else {
      // All sets of current exercise done - move to next exercise
      handleNextExercise();
    }
  }, [currentExercise, workout, setIndex, startTimerForCurrent, handleNextExercise]);
  
  // Handle set completion - ONLY increments completedSets, then starts rest
  const handleSetComplete = useCallback(() => {
    if (!currentExercise || isAdvancingRef.current) return;
    
    // CRITICAL: Clear timer before transitioning to rest
    clearTimer();
    
    // Increment completed sets (this is the ONLY place progress increases)
    setCompletedSets(prev => prev + 1);
    
    // Get rest duration (default 20-30 seconds)
    const restSec = parseSeconds(currentExercise?.rest) || 20;
    
    // Start rest timer (rest does NOT affect progress)
    setIsRestPhase(true);
    setSecondsLeft(restSec);
    setIsRunning(true);
    
    // Speak only if voice is enabled
    speak(`Set complete! Rest for ${secondsToSpeech(restSec)}. Next set starts automatically.`);
  }, [currentExercise, clearTimer, speak]);
  
  // Auto-advance when timer hits zero: set complete -> rest, or rest -> next set/exercise
  useEffect(() => {
    if (secondsLeft === 0 && !isAdvancingRef.current) {
      if (!isRestPhase && currentExercise) {
        // Set completed - start rest timer (progress already incremented in handleSetComplete)
        isAdvancingRef.current = true;
        handleSetComplete();
        // Reset flag after a short delay
        setTimeout(() => {
          isAdvancingRef.current = false;
        }, 100);
      } else if (isRestPhase) {
        // Rest timer finished - auto-advance to next set/exercise (no progress change)
        isAdvancingRef.current = true;
        clearTimer();
        setIsRunning(false);
        setIsRestPhase(false);
        handleNextSetOrExercise();
        // Reset flag after a short delay
        setTimeout(() => {
          isAdvancingRef.current = false;
        }, 100);
      }
    }
  }, [secondsLeft, isRestPhase, currentExercise, handleSetComplete, handleNextSetOrExercise, clearTimer]);

  // Handle skip set - clears timer, increments skippedSets, auto-starts next
  const handleSkipSet = useCallback(() => {
    if (!currentExercise || isAdvancingRef.current) return;
    
    // CRITICAL: Clear timer first to prevent freezing
    clearTimer();
    cancelSpeech();
    
    // Set advancing flag to prevent race conditions
    isAdvancingRef.current = true;
    
    // Increment skipped sets (does NOT affect progress)
    setSkippedSets(prev => prev + 1);
    
    toast({
      title: "⏭ Set skipped",
      description: "Next set started automatically!",
    });
    
    // Move immediately to next set or exercise
    const totalSetsForExercise = currentExercise.sets || 1;
    const currentSetIndex = setIndex;
    
    if (currentSetIndex + 1 < totalSetsForExercise) {
      // Move to next set in current exercise
      setIsRestPhase(false);
      setIsRunning(false);
      setSetIndex(currentSetIndex + 1);
      
      // Auto-start next set timer immediately (no pause)
      setTimeout(() => {
        isAdvancingRef.current = false;
        startTimerForCurrent();
      }, 50);
    } else {
      // All sets done - move to next exercise
      setIsRestPhase(false);
      setIsRunning(false);
      handleNextExercise();
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 50);
    }
  }, [currentExercise, setIndex, clearTimer, startTimerForCurrent, handleNextExercise, toast]);
  
  // Handle skip entire exercise - clears timer, increments skippedSets for all remaining sets, auto-starts next
  const handleSkipExercise = useCallback(() => {
    if (!currentExercise || !workout || isAdvancingRef.current) return;
    
    // CRITICAL: Clear timer first to prevent freezing
    clearTimer();
    cancelSpeech();
    
    // Set advancing flag to prevent race conditions
    isAdvancingRef.current = true;
    
    const remainingSets = (currentExercise.sets || 1) - setIndex;
    
    // Increment skipped sets by remaining sets (does NOT affect progress)
    setSkippedSets(prev => prev + remainingSets);
    
    // Track skipped exercise info
    setSkippedExercisesInfo(prev => {
      const existing = prev.find(p => p.exerciseIndex === exerciseIndex);
      if (existing) {
        return prev.map(p => 
          p.exerciseIndex === exerciseIndex 
            ? { ...p, skippedSets: p.skippedSets + remainingSets }
            : p
        );
      }
      return [...prev, {
        exerciseIndex,
        exerciseName: currentExercise.name,
        skippedSets: remainingSets
      }];
    });
    
    toast({
      title: "⏭ Exercise skipped",
      description: `${remainingSets} set(s) skipped. Next exercise started automatically!`,
    });
    
    // Move to next exercise and auto-start timer
    const currentExerciseIndex = exerciseIndex;
    
    if (currentExerciseIndex + 1 < exercises.length) {
      // Move to next exercise
      setIsRestPhase(false);
      setIsRunning(false);
      setExerciseIndex(currentExerciseIndex + 1);
      setSetIndex(0);
      
      // Auto-start next exercise timer immediately
      setTimeout(() => {
        isAdvancingRef.current = false;
        startTimerForCurrent();
      }, 50);
    } else {
      // Last exercise - end workout
      setIsRestPhase(false);
      setIsRunning(false);
      endWorkout();
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 50);
    }
  }, [currentExercise, workout, exercises, exerciseIndex, setIndex, clearTimer, startTimerForCurrent, endWorkout, toast]);

  const handleStart = () => {
    if (!currentExercise) return;
    // Start from current state
    startTimerForCurrent();
  };

  const handlePause = () => {
    setIsRunning(false);
    speak("Paused. Tap resume to continue.");
  };

  const handleResume = () => {
    if (secondsLeft !== null && secondsLeft > 0) {
      setIsRunning(true);
      speak(`Resuming ${isRestPhase ? 'rest' : currentExercise?.name || 'exercise'} with ${secondsToSpeech(secondsLeft)} remaining.`);
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setSecondsLeft(null);
    setSetIndex(0);
    setExerciseIndex(0);
    setIsRestPhase(false);
    setWorkoutStartTime(null);
    setCompletedSets(0);
    setSkippedSets(0);
    setSkippedExercisesInfo([]);
    isAdvancingRef.current = false;
    if (restTimerRef.current) {
      clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    }
    speak("Restarting workout. Begin with a light warm up for five minutes.");
  };

  const handleSkipRest = useCallback(() => {
    if (!isRestPhase || isAdvancingRef.current) return;
    
    // CRITICAL: Clear timer first
    clearTimer();
    cancelSpeech();
    
    // Set advancing flag
    isAdvancingRef.current = true;
    
    // Immediately proceed to next set/exercise (rest does NOT affect progress)
    setIsRunning(false);
    setIsRestPhase(false);
    setSecondsLeft(0);
    
    // Auto-start next set/exercise timer
    setTimeout(() => {
      isAdvancingRef.current = false;
      handleNextSetOrExercise();
    }, 50);
  }, [isRestPhase, clearTimer, handleNextSetOrExercise]);

  const handleVideoClick = (exercise: {name: string, videoUrl?: string, videoThumbnail?: string}) => {
    setSelectedExercise(exercise);
    setIsVideoModalOpen(true);
  };

  const formatTime = (s: number | null) => {
    if (s === null) return "--:--";
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  // Fallback UI when workout data is missing or invalid (AFTER all hooks are called)
  if (!hasValidWorkout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background">
        <div className="max-w-md w-full space-y-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-orange-600 mb-2">Workout Not Loaded</h2>
          <p className="text-gray-500 mb-6">
            The workout data could not be loaded. Please go back and select a workout again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate("/daily-workout")} 
              className="bg-primary text-white hover:bg-primary/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Workouts
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")} 
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button onClick={() => navigate(-1)} variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">{workout.name}</span>
            </div>
            <Button 
              variant={voiceEnabled ? "secondary" : "outline"} 
              size="sm"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) cancelSpeech();
              }}
              className={`bg-white/10 border-white text-white hover:bg-white hover:text-foreground transition-all duration-300 ${
                isSpeaking ? 'animate-pulse bg-primary/20' : ''
              }`}
            >
              {isSpeaking ? '🎤' : voiceEnabled ? '🔊' : '🔇'} Voice
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Workout Progress */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Workout Progress
              </h3>
              <span className="text-muted-foreground text-sm">
                {completedSets} of {totalSets} sets completed
              </span>
            </div>
            <Progress value={workoutProgress} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>0%</span>
              <span className="font-semibold">{workoutProgress}%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Timer Card */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            {/* Exercise Info */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-primary">
                  {isRestPhase ? "REST TIME" : "CURRENT EXERCISE"}
                </h2>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <h1 className="text-2xl font-bold mb-3">
                {currentExercise?.name}
              </h1>
              
              <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>Set {setIndex + 1} of {currentExercise?.sets || 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>{currentExercise?.reps}</span>
                </div>
              </div>
            </div>

            {/* Timer Display */}
            <div className={`text-center mb-6 p-6 rounded-2xl ${getTimerBgColor()} transition-all duration-500 relative`}>
              {/* Voice Speaking Effect */}
              {isSpeaking && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-4 border-primary/30 rounded-full animate-ping"></div>
                  <div className="absolute w-40 h-40 border-2 border-primary/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute w-48 h-48 border border-primary/10 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              )}
              
              <div className={`text-5xl font-bold ${getTimerColor()} mb-4 transition-all duration-300 relative z-10 min-h-[3rem] flex items-center justify-center`}>
                {formatTime(secondsLeft)}
              </div>
              
              {isRestPhase && secondsLeft !== null && (
                <div className="text-lg text-blue-600 font-semibold animate-pulse">
                  Take a breath... Next {setIndex + 1 < (currentExercise?.sets || 1) ? 'set' : 'exercise'} starts in {secondsLeft}s
                </div>
              )}
              
              {!isRestPhase && secondsLeft && secondsLeft <= 10 && (
                <div className="text-lg text-red-600 font-bold animate-bounce">
                  Almost there! 🔥
                </div>
              )}
            </div>

            {/* Exercise Tips */}
            {currentExercise && !isRestPhase && (
              <div className="bg-primary/10 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">Form Tip:</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tipsForExercise(currentExercise.name)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {!isRunning && (secondsLeft === null || secondsLeft > 0) && (
                <Button 
                  onClick={handleStart} 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {workoutStartTime ? 'Continue' : 'Start Workout'}
                </Button>
              )}
              
              {isRunning && (
                <Button 
                  onClick={handlePause} 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary hover:text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              {!isRunning && secondsLeft !== null && secondsLeft > 0 && (
                <Button 
                  onClick={handleResume} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}

              {isRestPhase && (
                <Button 
                  onClick={handleSkipRest}
                  variant="outline"
                  size="lg"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip Rest
                </Button>
              )}

              {!isRestPhase && (
                <>
                  <Button 
                    onClick={handleSkipSet} 
                    variant="outline" 
                    size="lg"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip Set
                  </Button>
                  
                  <Button 
                    onClick={handleSkipExercise} 
                    variant="outline" 
                    size="lg"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip Exercise
                  </Button>
                </>
              )}

              {!isRestPhase && currentExercise && (isRunning || secondsLeft !== null) && (
                <Button 
                  onClick={handleSetComplete}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Set
                </Button>
              )}

              {workoutStartTime && (
                <Button 
                  onClick={endWorkout}
                  variant="outline" 
                  size="lg"
                  className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              )}
              
              <Button 
                onClick={handleRestart} 
                variant="outline" 
                size="lg"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List - match Home page styling */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              EXERCISE BREAKDOWN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className={`p-6 border-2 rounded-2xl transition-all duration-300 ${
                  index === exerciseIndex
                    ? 'border-green-400 bg-green-400/20 shadow-lg shadow-green-400/20'
                    : skippedExercisesInfo.some(s => s.exerciseIndex === index)
                    ? 'border-orange-400 bg-orange-400/20 opacity-60'
                    : 'border-primary/20 hover:shadow-card hover:border-primary/40 bg-gradient-to-r from-background to-primary/5'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <AnimatedExercise exerciseName={exercise.name} className="w-12 h-12" />
                        <h4 className="font-semibold text-lg">{exercise.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === exerciseIndex && (
                        <Badge className="bg-green-400 text-green-900 font-bold">Current</Badge>
                      )}
                      {skippedExercisesInfo.some(s => s.exerciseIndex === index) && (
                        <Badge className="bg-orange-400 text-orange-900 font-bold">
                          {skippedExercisesInfo.find(s => s.exerciseIndex === index)?.skippedSets || 0} Skipped
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-primary/20 text-primary font-semibold px-3 py-1">
                        {exercise.sets} sets
                      </Badge>
                      <Button
                        onClick={() => handleVideoClick(exercise)}
                        variant="outline"
                        size="sm"
                        className="border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Watch
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="bg-white/50 rounded-lg p-3">
                      <span className="text-muted-foreground font-medium">Reps/Duration:</span>
                      <p className="font-semibold text-lg text-primary">{exercise.reps}</p>
                    </div>
                    {exercise.rest && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-muted-foreground font-medium">Rest:</span>
                        <p className="font-semibold text-lg text-blue-600">{exercise.rest}</p>
                      </div>
                    )}
                    {exercise.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <span className="text-muted-foreground font-medium">Notes:</span>
                        <p className="font-semibold text-lg text-yellow-700">{exercise.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercise Video Modal */}
      <ExerciseVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedExercise(null);
        }}
        exerciseName={selectedExercise?.name || ""}
        videoUrl={selectedExercise?.videoUrl}
        videoThumbnail={selectedExercise?.videoThumbnail}
      />
      
      {/* Workout Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Workout Complete! 🎉
            </DialogTitle>
            <DialogDescription>
              Great job! Here's your workout summary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Progress Summary */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">✅ Completed Sets:</span>
                <span className="text-2xl font-bold text-green-600">{completedSets}</span>
              </div>
              {skippedSets > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold">⏭ Skipped Sets:</span>
                  <span className="text-2xl font-bold text-orange-600">{skippedSets}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">🔥 Overall Progress:</span>
                <span className="text-2xl font-bold text-primary">{workoutProgress}%</span>
              </div>
            </div>

            {/* Skipped Exercises List */}
            {skippedExercisesInfo.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">⏭ Exercises with Skipped Sets:</h4>
                <ul className="space-y-1">
                  {skippedExercisesInfo.map((info, idx) => (
                    <li key={idx} className="text-sm text-orange-700">
                      • {info.exerciseName}: {info.skippedSets} set(s) skipped
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">{completedSets}</div>
                <div className="text-sm text-muted-foreground">Sets Completed</div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {workoutStartTime ? Math.round((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Calories Burned</span>
                <span className="text-xl font-bold text-primary">{workout?.caloriesBurn || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Workout Type</span>
                <Badge variant="secondary">{workout?.name || "N/A"}</Badge>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-sm font-medium text-green-800">
                💪 Keep up the amazing work! Consistency is key to reaching your goals.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSummary(false)} className="flex-1">
              Close
            </Button>
            <Button onClick={() => {
              setShowSummary(false);
              navigate("/dashboard");
            }} className="flex-1">
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutSession;


