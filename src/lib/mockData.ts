// Mock Firestore data for local development when Firebase is offline
// This allows the app to work without Firebase connection for testing

export interface MockCompletion {
  date: Date;
  dateKey: string;
  workoutType: string;
  workoutId: string;
  duration: string;
  calories: string;
  completed: boolean;
}

export interface MockUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  gender?: "male" | "female" | "other";
  age?: number;
  height?: number;
  weight?: number;
  fitnessGoal?: "weight_loss" | "muscle_gain" | "endurance" | "general";
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  preferredWorkoutTime?: "morning" | "afternoon" | "evening";
  intensityLevel?: "quickie" | "classic" | "power" | "beast";
  createdAt: Date;
}

// Generate mock workout completions for the past 30 days
export function generateMockCompletions(userId: string): MockCompletion[] {
  const completions: MockCompletion[] = [];
  const today = new Date();
  
  // Generate 15-20 random completions over the past 30 days
  const numCompletions = Math.floor(Math.random() * 6) + 15; // 15-20 completions
  const workoutTypes = ["quickie", "classic", "power", "beast"];
  const workoutIds = ["quickie-1", "quickie-2", "classic-1", "classic-2", "power-1", "power-2", "beast-1"];
  const durations = ["5-10 min", "20-30 min", "45-60 min", "90-120 min"];
  const calories = ["50-80", "200-300", "400-600", "600-900"];
  
  for (let i = 0; i < numCompletions; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 6, Math.floor(Math.random() * 60), 0, 0);
    
    const typeIndex = Math.floor(Math.random() * workoutTypes.length);
    const workoutType = workoutTypes[typeIndex];
    const dateKey = formatDateKey(date);
    
    completions.push({
      date,
      dateKey,
      workoutType,
      workoutId: workoutIds[Math.floor(Math.random() * workoutIds.length)],
      duration: durations[typeIndex] || "20-30 min",
      calories: calories[typeIndex] || "200-300",
      completed: true,
    });
  }
  
  // Sort by date (newest first)
  return completions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate mock user profile
export function generateMockUserProfile(userId: string, email: string): MockUserProfile {
  return {
    uid: userId,
    email,
    displayName: "Demo User",
    gender: "male",
    age: 28,
    height: 175,
    weight: 75,
    fitnessGoal: "muscle_gain",
    experienceLevel: "intermediate",
    preferredWorkoutTime: "evening",
    intensityLevel: "classic",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  };
}

// Check if we're in offline/mock mode
export function isOfflineMode(): boolean {
  // Check if Firebase is configured
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    return true;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // Allow enabling mock mode via localStorage
    return localStorage.getItem('fitline_mock_mode') === 'true';
  }
  
  return false;
}

// Mock Firestore collection helper
export class MockFirestore {
  private static data: Map<string, any> = new Map();
  
  static set(path: string, data: any) {
    this.data.set(path, data);
  }
  
  static get(path: string): any {
    return this.data.get(path);
  }
  
  static getAll(prefix: string): any[] {
    const results: any[] = [];
    for (const [key, value] of this.data.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value);
      }
    }
    return results;
  }
  
  static clear() {
    this.data.clear();
  }
}

