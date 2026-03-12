import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Play, Target, TrendingUp, Calendar, Zap, Dumbbell, Heart, Check, Video } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  workoutTypes, 
  getPersonalizedWorkout, 
  getRecommendedWorkoutType,
  getDifficultyColor,
  getDifficultyLabel,
  type Workout
} from "@/lib/workouts";
import ExerciseVideoModal from "@/components/ExerciseVideoModal";
import AnimatedExercise from "@/components/AnimatedExercise";

const DailyWorkout = () => {
  const [searchParams] = useSearchParams();
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const defaultWorkoutType = getRecommendedWorkoutType(userProfile);
  const workoutType = searchParams.get('type') || defaultWorkoutType;
  const [selectedWorkout, setSelectedWorkout] = useState(workoutType);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{name: string, videoUrl?: string, videoThumbnail?: string} | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Get today's workout (personalized and rotated by day)
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentWorkout = getPersonalizedWorkout(userProfile, selectedWorkout, today);
  const currentType = workoutTypes[selectedWorkout];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cardio": return <Heart className="w-4 h-4" />;
      case "strength": return <Dumbbell className="w-4 h-4" />;
      case "hiit": return <Zap className="w-4 h-4" />;
      case "mixed": return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getArticleContent = (workout: Workout, type: string): string => {
    const contentMap: Record<string, string> = {
      quickie: "Quick workouts are perfect for busy schedules. Research shows that even 5-10 minutes of exercise can boost metabolism, improve mood, and enhance cardiovascular health. These high-intensity bursts maximize calorie burn in minimal time.",
      classic: "Classic workouts provide the perfect balance of strength and cardio. Studies indicate that 20-30 minute sessions, performed consistently, lead to significant improvements in muscle tone, endurance, and overall fitness. This duration is ideal for sustainable long-term progress.",
      power: "Power sessions are designed for serious fitness enthusiasts. Extended 45-60 minute workouts allow for comprehensive training, progressive overload, and complete muscle group development. These sessions build both strength and cardiovascular capacity.",
      beast: "Beast mode workouts push your limits with maximum intensity. These extended sessions (90+ minutes) are for advanced athletes seeking peak performance. They combine strength, endurance, and mental fortitude for ultimate fitness transformation.",
    };
    return contentMap[type] || "This workout is designed to help you achieve your fitness goals through structured, progressive training.";
  };

  const getArticleTips = (type: string): string[] => {
    const tipsMap: Record<string, string[]> = {
      quickie: [
        "Focus on compound movements to maximize efficiency",
        "Maintain high intensity throughout the short duration",
        "Perfect for morning energy boosts or lunch breaks",
      ],
      classic: [
        "Warm up properly before starting",
        "Focus on form over speed",
        "Stay hydrated and take rest days between sessions",
      ],
      power: [
        "Ensure adequate nutrition before and after",
        "Progressive overload is key to continued gains",
        "Allow 48 hours recovery between power sessions",
      ],
      beast: [
        "Only attempt if you're an advanced athlete",
        "Ensure proper nutrition and hydration",
        "Listen to your body and rest when needed",
      ],
    };
    return tipsMap[type] || ["Stay consistent", "Track your progress", "Listen to your body"];
  };

  const markTodayComplete = async () => {
    if (!user) {
      toast({
        title: "Please log in first",
        description: "You need to be logged in to save workout progress.",
        variant: "destructive",
      });
      return;
    }

    if (!db) {
      toast({
        title: "Database Error",
        description: "Firebase is not initialized. Please check your configuration.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingCompletion(true);
      
      // Use consistent date key format (local timezone)
      const now = new Date();
      const dateKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      
      const ref = doc(db, "users", user.uid, "completions", dateKey);
      
      const completionData = {
        date: serverTimestamp(),
        dateKey,
        workoutType: selectedWorkout,
        workoutId: currentWorkout.id,
        duration: currentWorkout.duration || "10-30 min",
        calories: currentWorkout.caloriesBurn || "100-200",
        completed: true,
      };

      console.log("Attempting to save workout completion:", {
        path: `users/${user.uid}/completions/${dateKey}`,
        data: completionData,
      });

      await setDoc(ref, completionData, { merge: true });

      console.log("✅ Workout completion saved successfully");

      toast({
        title: "✅ Workout progress saved!",
        description: `Great job completing ${currentWorkout.name}! Your progress has been recorded.`,
      });
    } catch (error) {
      // Use consistent date key format for error logging
      const now = new Date();
      const dateKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      
      console.error("Failed to save workout completion:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to save workout progress. Please try again.";
      let errorCode = "";
      
      // Extract Firebase error code if available
      if (error && typeof error === 'object' && 'code' in error) {
        errorCode = String(error.code);
      }
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        const errorCodeLower = errorCode.toLowerCase();
        
        if (errorMsg.includes("permission") || errorCodeLower.includes("permission") || errorCode === "permission-denied") {
          errorMessage = "⚠️ Permission denied. Please deploy Firestore security rules. See TROUBLESHOOTING.md for help.";
        } else if (errorMsg.includes("network") || errorMsg.includes("unavailable") || errorCodeLower.includes("unavailable")) {
          errorMessage = "🌐 Network error. Please check your internet connection and try again.";
        } else if (errorMsg.includes("not-found") || errorCodeLower.includes("not-found") || errorCode === "not-found") {
          errorMessage = "❌ Database not found. Please check your Firebase configuration in .env.local";
        } else if (errorMsg.includes("unauthenticated") || errorCodeLower.includes("unauthenticated")) {
          errorMessage = "🔐 Authentication error. Please log out and log back in.";
        } else {
          errorMessage = `Error: ${error.message || errorCode || 'Unknown error'}. Check browser console for details.`;
        }
      } else if (errorCode) {
        errorMessage = `Firebase error (${errorCode}). Check browser console for details.`;
      }
      
      // Log full error for debugging
      console.error("Full error details:", {
        error,
        errorCode,
        user: user?.uid,
        dateKey,
        workoutType: selectedWorkout,
        workoutId: currentWorkout.id,
        firebaseConfig: {
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
        },
      });
      
      toast({
        title: "Error Saving Workout",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show longer for important errors
      });
    } finally {
      setSavingCompletion(false);
    }
  };

  const handleVideoClick = (exercise: {name: string, videoUrl?: string, videoThumbnail?: string}) => {
    setSelectedExercise(exercise);
    setIsVideoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-heading text-3xl">TODAY'S WORKOUT</h1>
              <p className="text-white/90">Personalized for your fitness level</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={selectedWorkout} onValueChange={setSelectedWorkout} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(workoutTypes).map(([key, type]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${type.color}`} />
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedWorkout} className="space-y-6">
            {/* Workout Overview */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-heading text-2xl flex items-center gap-2">
                      <Clock className="w-6 h-6 text-primary" />
                      {currentWorkout.name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">{currentWorkout.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getCategoryIcon(currentWorkout.category)}
                      {currentWorkout.category.toUpperCase()}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getDifficultyColor(currentWorkout.difficulty)} border-current`}
                    >
                      {getDifficultyLabel(currentWorkout.difficulty)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Workout Stats */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg">WORKOUT STATS</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-semibold">{currentWorkout.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calories:</span>
                        <span className="font-semibold">{currentWorkout.caloriesBurn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exercises:</span>
                        <span className="font-semibold">{currentWorkout.exercises.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Equipment:</span>
                        <span className="font-semibold">{currentWorkout.equipment.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Target Muscles */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg">TARGET MUSCLES</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentWorkout.targetMuscles.map((muscle, index) => (
                        <Badge key={index} variant="outline">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg">QUICK ACTIONS</h3>
                    <div className="space-y-3">
                      <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <Link to={`/workout-session?workout=${currentWorkout.id}&type=${selectedWorkout}`}>
                          <Play className="w-5 h-5 mr-2" />
                          🚀 Start Workout
                        </Link>
                      </Button>
                      <Button onClick={markTodayComplete} variant="outline" className="w-full" disabled={savingCompletion}>
                        <Check className="w-4 h-4 mr-2" />
                        {savingCompletion ? "Saving..." : "Mark as Done"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise List */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  EXERCISE BREAKDOWN
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentWorkout.exercises.map((exercise, index) => (
                    <div key={index} className="p-6 border-2 border-primary/20 rounded-2xl hover:shadow-card hover:border-primary/40 transition-all duration-300 bg-gradient-to-r from-background to-primary/5">
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

            {/* Related Article */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  RELATED ARTICLE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 border rounded-lg hover:shadow-card transition-smooth bg-gradient-to-r from-primary/5 to-primary/10">
                  <h4 className="font-heading text-xl mb-3">{currentWorkout.blogTitle}</h4>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {getArticleContent(currentWorkout, selectedWorkout)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="font-semibold text-primary">💡 Key Tips:</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {getArticleTips(selectedWorkout).map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
    </div>
  );
};

export default DailyWorkout;