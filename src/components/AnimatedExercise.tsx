import React from 'react';

interface AnimatedExerciseProps {
  exerciseName: string;
  className?: string;
}

const AnimatedExercise: React.FC<AnimatedExerciseProps> = ({ exerciseName, className = "" }) => {
  // Constrained container so the animation never overlaps surrounding text
  const containerClass = `relative overflow-hidden shrink-0 ${className || 'w-10 h-10'}`;

  const getExerciseAnimation = (name: string) => {
    const exercise = name.toLowerCase();
    
    if (exercise.includes('jumping jacks')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 m-auto w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white font-bold text-sm">JJ</span>
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('push-up') || exercise.includes('pushup')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-gray-600 rounded animate-pulse"></div>
            <div className="absolute inset-0 m-auto w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white font-bold text-xs">PU</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('squat')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 m-auto w-8 h-10 bg-purple-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white font-bold text-sm">SQ</span>
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-gray-400 rounded"></div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('plank')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-orange-500 rounded animate-pulse"></div>
            <div className="absolute inset-0 m-auto w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">PL</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('mountain climber')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-green-500 rounded animate-pulse"></div>
            <div className="absolute inset-0 m-auto w-6 h-6 bg-green-600 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white font-bold text-xs">MC</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-green-400 rounded-full animate-ping"></div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('burpee')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 m-auto w-9 h-9 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white font-bold text-xs">BP</span>
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('lunge')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 m-auto w-6 h-9 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white font-bold text-xs">LG</span>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('warm-up') || exercise.includes('warmup')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 m-auto w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
              <span className="text-white font-bold text-sm">WU</span>
            </div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-orange-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }
    
    if (exercise.includes('cool-down') || exercise.includes('cooldown')) {
      return (
        <div className={`flex items-center justify-center ${containerClass}`}>
          <div className="relative w-full h-full">
            <div className="absolute inset-0 m-auto w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-sm">CD</span>
            </div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-300 rounded-full animate-ping"></div>
          </div>
        </div>
      );
    }
    
    // Default animation for unknown exercises
    return (
      <div className={`flex items-center justify-center ${containerClass}`}>
        <div className="relative w-full h-full">
          <div className="absolute inset-0 m-auto w-9 h-9 bg-primary rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white font-bold text-sm">EX</span>
          </div>
          <div className="absolute top-0 right-0 w-3 h-3 bg-primary/60 rounded-full animate-ping"></div>
        </div>
      </div>
    );
  };

  return getExerciseAnimation(exerciseName);
};

export default AnimatedExercise;
