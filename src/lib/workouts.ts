import { UserProfile } from "@/contexts/AuthContext";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  duration?: string;
  rest?: string;
  notes?: string;
  videoUrl?: string;
  videoThumbnail?: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: "cardio" | "strength" | "flexibility" | "hiit" | "mixed";
  exercises: Exercise[];
  guideLink: string;
  blogTitle: string;
  targetMuscles: string[];
  equipment: string[];
  caloriesBurn: string;
  suitableFor: ("beginner" | "intermediate" | "advanced")[];
  goals: ("weight_loss" | "muscle_gain" | "endurance" | "general")[];
}

export interface WorkoutType {
  name: string;
  duration: string;
  description: string;
  color: string;
  workouts: Workout[];
}

// Base workout data
const baseWorkouts: Record<string, Workout[]> = {
  quickie: [
    {
      id: "quickie-1",
      name: "Morning Energizer",
      description: "Wake up your muscles with dynamic movements that boost energy and metabolism. Perfect for busy mornings.",
      duration: "5-10 min",
      difficulty: 1,
      category: "cardio",
      exercises: [
        { 
          name: "Jumping Jacks", 
          sets: 1, 
          reps: "30 seconds", 
          rest: "10 seconds",
          videoUrl: "https://www.youtube.com/embed/UpH7rm0cYbM",
          videoThumbnail: "https://img.youtube.com/vi/UpH7rm0cYbM/maxresdefault.jpg"
        },
        { 
          name: "Push-ups", 
          sets: 2, 
          reps: "10-15 reps", 
          rest: "30 seconds",
          videoUrl: "https://www.youtube.com/embed/0pkjOk0EiAk",
          videoThumbnail: "https://img.youtube.com/vi/0pkjOk0EiAk/maxresdefault.jpg"
        },
        { 
          name: "Mountain Climbers", 
          sets: 1, 
          reps: "30 seconds", 
          rest: "10 seconds",
          videoUrl: "https://www.youtube.com/embed/cnyTQDSE884",
          videoThumbnail: "https://img.youtube.com/vi/cnyTQDSE884/maxresdefault.jpg"
        },
        { 
          name: "Squats", 
          sets: 2, 
          reps: "15-20 reps", 
          rest: "30 seconds",
          videoUrl: "https://www.youtube.com/embed/gsNoPYwWXeM",
          videoThumbnail: "https://img.youtube.com/vi/gsNoPYwWXeM/maxresdefault.jpg"
        },
        { 
          name: "Plank", 
          sets: 1, 
          reps: "30 seconds", 
          rest: "10 seconds",
          videoUrl: "https://www.youtube.com/embed/pSHjTRCQxIw",
          videoThumbnail: "https://img.youtube.com/vi/pSHjTRCQxIw/maxresdefault.jpg"
        }
      ],
      guideLink: "https://FitLine-Gym.com/blog/5-minute-morning-routine",
      blogTitle: "5-Minute Morning Routine That Actually Works",
      targetMuscles: ["Full Body", "Core", "Cardiovascular"],
      equipment: ["None"],
      caloriesBurn: "50-80 calories",
      suitableFor: ["beginner", "intermediate", "advanced"],
      goals: ["weight_loss", "endurance", "general"]
    },
    {
      id: "quickie-2",
      name: "Power Burst",
      description: "High-intensity intervals to maximize calorie burn in minimal time.",
      duration: "8-12 min",
      difficulty: 2,
      category: "hiit",
      exercises: [
        { 
          name: "Burpees", 
          sets: 3, 
          reps: "10 reps", 
          rest: "30 seconds",
          videoUrl: "https://www.youtube.com/embed/TU8QYVW0gDU",
          videoThumbnail: "https://img.youtube.com/vi/TU8QYVW0gDU/maxresdefault.jpg"
        },
        { 
          name: "High Knees", 
          sets: 3, 
          reps: "30 seconds", 
          rest: "15 seconds",
          videoUrl: "https://www.youtube.com/embed/UpH7rm0cYbM",
          videoThumbnail: "https://img.youtube.com/vi/UpH7rm0cYbM/maxresdefault.jpg"
        },
        { 
          name: "Push-up to Side Plank", 
          sets: 2, 
          reps: "8 reps each side", 
          rest: "30 seconds",
          videoUrl: "https://www.youtube.com/embed/0pkjOk0EiAk",
          videoThumbnail: "https://img.youtube.com/vi/0pkjOk0EiAk/maxresdefault.jpg"
        },
        { 
          name: "Jump Squats", 
          sets: 3, 
          reps: "12 reps", 
          rest: "30 seconds",
          videoUrl: "https://www.youtube.com/embed/gsNoPYwWXeM",
          videoThumbnail: "https://img.youtube.com/vi/gsNoPYwWXeM/maxresdefault.jpg"
        }
      ],
      guideLink: "https://FitLine-Gym.com/blog/power-burst-workout",
      blogTitle: "Power Burst: Maximize Results in Minimal Time",
      targetMuscles: ["Full Body", "Lower Body", "Core"],
      equipment: ["None"],
      caloriesBurn: "80-120 calories",
      suitableFor: ["intermediate", "advanced"],
      goals: ["weight_loss", "endurance"]
    }
  ],
  classic: [
    {
      id: "classic-1",
      name: "Full Body Power",
      description: "A complete workout targeting all major muscle groups with the perfect balance of strength and cardio.",
      duration: "20-30 min",
      difficulty: 2,
      category: "mixed",
      exercises: [
        { 
          name: "Warm-up", 
          sets: 1, 
          reps: "5 minutes", 
          notes: "Light cardio and dynamic stretches",
          videoUrl: "https://www.youtube.com/embed/UpH7rm0cYbM",
          videoThumbnail: "https://img.youtube.com/vi/UpH7rm0cYbM/maxresdefault.jpg"
        },
        { 
          name: "Push-ups", 
          sets: 3, 
          reps: "12-15 reps", 
          rest: "60 seconds",
          videoUrl: "https://www.youtube.com/embed/0pkjOk0EiAk",
          videoThumbnail: "https://img.youtube.com/vi/0pkjOk0EiAk/maxresdefault.jpg"
        },
        { 
          name: "Squats", 
          sets: 3, 
          reps: "15-20 reps", 
          rest: "60 seconds",
          videoUrl: "https://www.youtube.com/embed/gsNoPYwWXeM",
          videoThumbnail: "https://img.youtube.com/vi/gsNoPYwWXeM/maxresdefault.jpg"
        },
        { 
          name: "Dumbbell Rows", 
          sets: 3, 
          reps: "12 reps each arm", 
          rest: "60 seconds",
          videoUrl: "https://www.youtube.com/embed/riAutegDqdI",
          videoThumbnail: "https://img.youtube.com/vi/riAutegDqdI/maxresdefault.jpg"
        },
        { 
          name: "Lunges", 
          sets: 3, 
          reps: "10 reps each leg", 
          rest: "60 seconds",
          videoUrl: "https://www.youtube.com/embed/3XDriUn0udo",
          videoThumbnail: "https://img.youtube.com/vi/3XDriUn0udo/maxresdefault.jpg"
        },
        { 
          name: "Plank", 
          sets: 3, 
          reps: "30-45 seconds", 
          rest: "60 seconds",
          videoUrl: "https://www.youtube.com/embed/pSHjTRCQxIw",
          videoThumbnail: "https://img.youtube.com/vi/pSHjTRCQxIw/maxresdefault.jpg"
        },
        { 
          name: "Cool-down", 
          sets: 1, 
          reps: "5 minutes", 
          notes: "Static stretches",
          videoUrl: "https://www.youtube.com/embed/4vTJHUDB5ak",
          videoThumbnail: "https://img.youtube.com/vi/4vTJHUDB5ak/maxresdefault.jpg"
        }
      ],
      guideLink: "https://FitLine-Gym.com/blog/full-body-power-workout",
      blogTitle: "The Science Behind 30-Minute Workouts",
      targetMuscles: ["Full Body", "Upper Body", "Lower Body", "Core"],
      equipment: ["Dumbbells (optional)"],
      caloriesBurn: "200-300 calories",
      suitableFor: ["beginner", "intermediate", "advanced"],
      goals: ["weight_loss", "muscle_gain", "endurance", "general"]
    },
    {
      id: "classic-2",
      name: "Strength Foundation",
      description: "Build functional strength with compound movements and proper form.",
      duration: "25-35 min",
      difficulty: 2,
      category: "strength",
      exercises: [
        { name: "Warm-up", sets: 1, reps: "5 minutes", notes: "Mobility work and light cardio" },
        { name: "Goblet Squats", sets: 4, reps: "12-15 reps", rest: "90 seconds" },
        { name: "Incline Push-ups", sets: 4, reps: "12-15 reps", rest: "90 seconds" },
        { name: "Romanian Deadlifts", sets: 3, reps: "12 reps", rest: "90 seconds" },
        { name: "Bent-over Rows", sets: 3, reps: "12 reps", rest: "90 seconds" },
        { name: "Core Circuit", sets: 3, reps: "30 seconds each", rest: "60 seconds" }
      ],
      guideLink: "https://FitLine-Gym.com/blog/strength-foundation",
      blogTitle: "Building Functional Strength: A Complete Guide",
      targetMuscles: ["Full Body", "Posterior Chain", "Core"],
      equipment: ["Dumbbells", "Resistance Bands"],
      caloriesBurn: "250-350 calories",
      suitableFor: ["beginner", "intermediate"],
      goals: ["muscle_gain", "general"]
    }
  ],
  power: [
    {
      id: "power-1",
      name: "Athletic Performance",
      description: "Advanced training combining strength, endurance, and agility for serious fitness enthusiasts.",
      duration: "45-60 min",
      difficulty: 4,
      category: "mixed",
      exercises: [
        { name: "Dynamic Warm-up", sets: 1, reps: "10 minutes", notes: "Movement prep and activation" },
        { name: "Power Cleans", sets: 4, reps: "6-8 reps", rest: "120 seconds" },
        { name: "Box Jumps", sets: 4, reps: "8-10 reps", rest: "90 seconds" },
        { name: "Pull-ups", sets: 4, reps: "8-12 reps", rest: "120 seconds" },
        { name: "Sprint Intervals", sets: 6, reps: "30 seconds", rest: "90 seconds" },
        { name: "Core Complex", sets: 3, reps: "45 seconds each", rest: "60 seconds" },
        { name: "Cool-down", sets: 1, reps: "10 minutes", notes: "Recovery and flexibility" }
      ],
      guideLink: "https://FitLine-Gym.com/blog/athletic-performance",
      blogTitle: "Building Athletic Performance in 60 Minutes",
      targetMuscles: ["Full Body", "Explosive Power", "Cardiovascular"],
      equipment: ["Barbell", "Box", "Pull-up Bar"],
      caloriesBurn: "400-600 calories",
      suitableFor: ["advanced"],
      goals: ["muscle_gain", "endurance"]
    },
    {
      id: "power-2",
      name: "Hypertrophy Focus",
      description: "Muscle-building workout with higher volume and targeted isolation exercises.",
      duration: "50-65 min",
      difficulty: 3,
      category: "strength",
      exercises: [
        { name: "Warm-up", sets: 1, reps: "8 minutes", notes: "Cardio and mobility" },
        { name: "Bench Press", sets: 4, reps: "8-12 reps", rest: "120 seconds" },
        { name: "Squats", sets: 4, reps: "10-12 reps", rest: "120 seconds" },
        { name: "Bent-over Rows", sets: 4, reps: "10-12 reps", rest: "90 seconds" },
        { name: "Overhead Press", sets: 3, reps: "8-12 reps", rest: "90 seconds" },
        { name: "Accessory Work", sets: 3, reps: "12-15 reps each", rest: "60 seconds" }
      ],
      guideLink: "https://FitLine-Gym.com/blog/hypertrophy-focus",
      blogTitle: "Hypertrophy Training: Science-Based Approach",
      targetMuscles: ["Upper Body", "Lower Body", "Shoulders"],
      equipment: ["Barbell", "Dumbbells", "Bench"],
      caloriesBurn: "350-500 calories",
      suitableFor: ["intermediate", "advanced"],
      goals: ["muscle_gain"]
    }
  ],
  beast: [
    {
      id: "beast-1",
      name: "Ultimate Challenge",
      description: "Maximum intensity training designed for those ready to push their absolute limits.",
      duration: "90-120 min",
      difficulty: 5,
      category: "mixed",
      exercises: [
        { name: "Extended Warm-up", sets: 1, reps: "15 minutes", notes: "Comprehensive mobility and activation" },
        { name: "Deadlifts", sets: 5, reps: "5-8 reps", rest: "180 seconds" },
        { name: "Weighted Pull-ups", sets: 4, reps: "6-10 reps", rest: "150 seconds" },
        { name: "Military Press", sets: 4, reps: "6-8 reps", rest: "150 seconds" },
        { name: "Squats", sets: 4, reps: "8-10 reps", rest: "180 seconds" },
        { name: "Endurance Circuit", sets: 4, reps: "5 minutes each", rest: "120 seconds" },
        { name: "Skill Work", sets: 3, reps: "10 minutes each", rest: "90 seconds" },
        { name: "Recovery Protocol", sets: 1, reps: "15 minutes", notes: "Cool-down and stretching" }
      ],
      guideLink: "https://FitLine-Gym.com/blog/ultimate-challenge",
      blogTitle: "Beast Mode: The Psychology of Extreme Training",
      targetMuscles: ["Full Body", "CNS", "Endurance"],
      equipment: ["Full Gym", "Advanced Equipment"],
      caloriesBurn: "600-900 calories",
      suitableFor: ["advanced"],
      goals: ["muscle_gain", "endurance"]
    }
  ]
};

export const workoutTypes: Record<string, WorkoutType> = {
  quickie: {
    name: "Quickie",
    duration: "5-10 min",
    description: "Fast-paced, high-intensity burst",
    color: "bg-green-500",
    workouts: baseWorkouts.quickie
  },
  classic: {
    name: "Classic",
    duration: "20-30 min",
    description: "Balanced workout for daily routine",
    color: "bg-primary",
    workouts: baseWorkouts.classic
  },
  power: {
    name: "Power",
    duration: "45-60 min",
    description: "Comprehensive training session",
    color: "bg-orange-500",
    workouts: baseWorkouts.power
  },
  beast: {
    name: "Beast Mode",
    duration: "1.5+ hrs",
    description: "Ultimate challenge for dedicated athletes",
    color: "bg-red-500",
    workouts: baseWorkouts.beast
  }
};

// Get personalized workout based on user profile and day
export const getPersonalizedWorkout = (
  userProfile: UserProfile | null,
  workoutType: string,
  dayOfWeek?: number
): Workout => {
  const type = workoutTypes[workoutType];
  if (!type) {
    throw new Error(`Invalid workout type: ${workoutType}`);
  }

  let availableWorkouts = type.workouts;

  // Filter by experience level
  if (userProfile?.experienceLevel) {
    availableWorkouts = availableWorkouts.filter(workout =>
      workout.suitableFor.includes(userProfile.experienceLevel!)
    );
  }

  // Filter by fitness goal
  if (userProfile?.fitnessGoal) {
    availableWorkouts = availableWorkouts.filter(workout =>
      workout.goals.includes(userProfile.fitnessGoal!)
    );
  }

  // If no workouts match criteria, fall back to all workouts
  if (availableWorkouts.length === 0) {
    availableWorkouts = type.workouts;
  }

  // Use day of week to rotate workouts (if provided)
  if (dayOfWeek !== undefined) {
    const index = dayOfWeek % availableWorkouts.length;
    return availableWorkouts[index];
  }

  // Default to first workout
  return availableWorkouts[0];
};

// Get today's recommended workout type based on user preferences
export const getRecommendedWorkoutType = (userProfile: UserProfile | null): string => {
  if (!userProfile) return "classic";

  // Use user's preferred intensity level
  if (userProfile.intensityLevel && workoutTypes[userProfile.intensityLevel]) {
    return userProfile.intensityLevel;
  }

  // Default based on experience level
  switch (userProfile.experienceLevel) {
    case "beginner":
      return "quickie";
    case "intermediate":
      return "classic";
    case "advanced":
      return "power";
    default:
      return "classic";
  }
};

// Get difficulty color
export const getDifficultyColor = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return "text-green-500";
    case 2: return "text-blue-500";
    case 3: return "text-yellow-500";
    case 4: return "text-orange-500";
    case 5: return "text-red-500";
    default: return "text-gray-500";
  }
};

// Get difficulty label
export const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return "Beginner";
    case 2: return "Easy";
    case 3: return "Moderate";
    case 4: return "Hard";
    case 5: return "Expert";
    default: return "Unknown";
  }
}; 