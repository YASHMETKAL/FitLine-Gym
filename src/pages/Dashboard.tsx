import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Download, Quote, Target, TrendingUp, User, LogOut, Droplet, Plus, Minus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getPersonalizedWorkout, getRecommendedWorkoutType, getDifficultyColor, getDifficultyLabel } from "@/lib/workouts";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  generateWorkoutTrackerPDF, 
  generateNutritionGuidePDF, 
  generateExerciseFormGuidePDF, 
  generateGoalSettingWorksheetPDF,
  downloadPDF 
} from "@/lib/pdfGenerator";

const Dashboard = () => {
  const { userProfile, logout, refreshProfile, user } = useAuth();
  const { toast } = useToast();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [goal, setGoal] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [saving, setSaving] = useState(false);
  // Unified weekly data state
  const [weeklyCompletions, setWeeklyCompletions] = useState<Set<string>>(new Set()); // Set of dateKeys (YYYY-MM-DD) for current week
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0);
  const weeklyGoal = 7;
  const waterGoal = 8; // 8 glasses (2L)
  
  // Day names in order (Mon-Sun)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    // If key profile fields are missing, prompt user to complete profile
    if (userProfile) {
      const missingBasics = !userProfile.fitnessGoal || !userProfile.experienceLevel;
      setShowCompleteProfile(missingBasics);
      setGoal((userProfile.fitnessGoal as any) || "");
      setExperience((userProfile.experienceLevel as any) || "");
    }
  }, [userProfile]);

  const saveBasics = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        fitnessGoal: goal || null,
        experienceLevel: experience || null,
        updatedAt: new Date(),
      });
      await refreshProfile();
      setShowCompleteProfile(false);
    } catch (e) {
      console.error("Failed to save basics", e);
    } finally {
      setSaving(false);
    }
  };
  const todaysQuote = "The only bad workout is the one that didn't happen.";
  
  // Handle Share Quote button
  const handleShareQuote = async () => {
    const quoteText = todaysQuote || "Stay fit, stay strong! 💪";
    
    try {
      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share({
          title: "FitLine-Gym Quote",
          text: quoteText,
          url: window.location.href
        });
        toast({
          title: "Quote shared! 🎉",
          description: "Thanks for sharing the motivation!",
        });
      } else if (navigator.clipboard) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(quoteText);
        toast({
          title: "Quote copied! 📋",
          description: "Quote copied to clipboard.",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = quoteText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({
          title: "Quote copied! 📋",
          description: "Quote copied to clipboard.",
        });
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to share quote:", error);
        toast({
          title: "Error",
          description: "Failed to share quote. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Helper function to convert date to dateKey (YYYY-MM-DD)
  const toDateKey = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  
  // Helper function to get day name from dateKey
  const getDayNameFromDateKey = (dateKey: string): string => {
    const date = new Date(dateKey + 'T00:00:00');
    const dayIndex = (date.getDay() + 6) % 7; // Mon=0, Sun=6
    return dayNames[dayIndex];
  };
  
  // Helper function to get current week dateKeys (Mon-Sun)
  const getCurrentWeekDateKeys = (): string[] => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // convert Sun=0 to Mon=0
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    
    const weekKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekKeys.push(toDateKey(date));
    }
    return weekKeys;
  };
  
  // Unified data source: Real-time Firestore listener for weekly completions
  useEffect(() => {
    if (!user) return;
    
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    const startKey = toDateKey(monday);
    const endKey = toDateKey(sunday);
    
    // Set up real-time listener
    const completionsRef = collection(db, "users", user.uid, "completions");
    const unsubscribe = onSnapshot(completionsRef, (snapshot) => {
      // Track all completion dates for streak calculation
      const allCompletionDates: string[] = [];
      // Track current week completions
      const weekCompletionsSet = new Set<string>();
      let total = 0;
      let totalMinutes = 0;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.completed) {
          total += 1;
          const dateKey = data.dateKey || docSnap.id;
          allCompletionDates.push(dateKey);
          
          // Parse duration (e.g., "25 min" -> 25)
          const durationStr = data.duration || "";
          const durationMatch = durationStr.match(/(\d+)/);
          if (durationMatch) {
            totalMinutes += parseInt(durationMatch[1], 10);
          }
          
          // Check if this completion is in current week
          if (dateKey >= startKey && dateKey <= endKey) {
            weekCompletionsSet.add(dateKey);
          }
        }
      });
      
      // Update weekly completions state
      setWeeklyCompletions(weekCompletionsSet);
      setTotalWorkouts(total);
      setTotalHours(Math.round(totalMinutes / 60 * 10) / 10);
      
      // Calculate streak (consecutive days with workouts)
      let streak = 0;
      if (allCompletionDates.length > 0) {
        const sortedDates = [...new Set(allCompletionDates)].sort().reverse();
        const today = toDateKey(new Date());
        let checkDate = today;
        let checkIndex = 0;
        
        while (checkIndex < sortedDates.length) {
          if (sortedDates[checkIndex] === checkDate) {
            streak += 1;
            checkIndex += 1;
            const prevDate = new Date(checkDate + 'T00:00:00');
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = toDateKey(prevDate);
          } else {
            const nextDate = new Date(checkDate + 'T00:00:00');
            nextDate.setDate(nextDate.getDate() - 1);
            const nextDateKey = toDateKey(nextDate);
            if (sortedDates[checkIndex] < nextDateKey) {
              break;
            }
            checkDate = nextDateKey;
          }
        }
      }
      setCurrentStreak(streak);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Compute derived data from unified weeklyCompletions
  const currentWeekDateKeys = getCurrentWeekDateKeys();
  const weeklyProgress = weeklyCompletions.size;
  
  // Map each day (Mon-Sun) to whether it has a workout
  const weekProgressDays = dayNames.map((dayName, index) => {
    const dateKey = currentWeekDateKeys[index];
    return {
      day: dayName,
      dateKey,
      completed: weeklyCompletions.has(dateKey)
    };
  });
  
  // Activity chart data (same source as weekProgressDays)
  const weeklyChartData = weekProgressDays.map(day => ({
    day: day.day,
    workouts: day.completed ? 1 : 0
  }));

  // Load water intake from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`water_${today}`);
    if (stored) {
      setWaterIntake(parseInt(stored, 10));
    }
  }, []);

  const updateWaterIntake = (change: number) => {
    const newValue = Math.max(0, Math.min(waterGoal, waterIntake + change));
    setWaterIntake(newValue);
    const today = new Date().toDateString();
    localStorage.setItem(`water_${today}`, newValue.toString());
  };

  // Calculate TDEE for nutrition guide
  const calculateTDEE = () => {
    if (!userProfile?.weight || !userProfile?.height || !userProfile?.age || !userProfile?.gender) return null;
    
    let bmr: number;
    if (userProfile.gender === "male") {
      bmr = 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * userProfile.age);
    } else {
      bmr = 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * userProfile.age);
    }
    
    return Math.round(bmr * 1.55); // Moderate activity
  };

  const tdee = calculateTDEE();

  // Download handlers
  const handleDownloadWorkoutTracker = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to download resources.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch workout completions
      const completionsRef = collection(db, "users", user.uid, "completions");
      const snapshot = await getDocs(query(completionsRef, orderBy("date", "desc")));
      const workoutLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.dateKey || doc.id,
          workoutType: data.workoutType || "Unknown",
          workoutName: data.workoutId || "Workout",
          duration: data.duration || "N/A",
          calories: data.calories || "N/A",
        };
      });

      const html = generateWorkoutTrackerPDF(workoutLogs, {
        displayName: userProfile?.displayName || null,
        fitnessGoal: userProfile?.fitnessGoal || null,
        experienceLevel: userProfile?.experienceLevel || null,
        height: userProfile?.height || null,
        weight: userProfile?.weight || null,
      });
      
      downloadPDF(html, `workout-tracker-${new Date().toISOString().split('T')[0]}`);
      
      toast({
        title: "Download started!",
        description: "Your workout tracker is ready. Use your browser's print dialog to save as PDF.",
      });
    } catch (error) {
      console.error("Failed to generate workout tracker:", error);
      toast({
        title: "Error",
        description: "Failed to generate workout tracker. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadNutritionGuide = () => {
    if (!userProfile) {
      toast({
        title: "Complete your profile",
        description: "Please complete your profile to get personalized nutrition guidance.",
        variant: "destructive",
      });
      return;
    }

    const html = generateNutritionGuidePDF({
      displayName: userProfile.displayName || null,
      fitnessGoal: userProfile.fitnessGoal || null,
      experienceLevel: userProfile.experienceLevel || null,
      height: userProfile.height || null,
      weight: userProfile.weight || null,
    }, tdee);
    
    downloadPDF(html, `nutrition-guide-${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Download started!",
      description: "Your nutrition guide is ready. Use your browser's print dialog to save as PDF.",
    });
  };

  const handleDownloadExerciseFormGuide = () => {
    const html = generateExerciseFormGuidePDF();
    downloadPDF(html, `exercise-form-guide-${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Download started!",
      description: "Your exercise form guide is ready. Use your browser's print dialog to save as PDF.",
    });
  };

  const handleDownloadGoalWorksheet = () => {
    const html = generateGoalSettingWorksheetPDF({
      displayName: userProfile?.displayName || null,
      fitnessGoal: userProfile?.fitnessGoal || null,
      experienceLevel: userProfile?.experienceLevel || null,
      height: userProfile?.height || null,
      weight: userProfile?.weight || null,
    });
    
    downloadPDF(html, `goal-worksheet-${new Date().toISOString().split('T')[0]}`);
    
    toast({
      title: "Download started!",
      description: "Your goal worksheet is ready. Use your browser's print dialog to save as PDF.",
    });
  };

  // Get personalized workout recommendation
  const recommendedType = getRecommendedWorkoutType(userProfile);
  const today = new Date().getDay();
  const todaysWorkout = getPersonalizedWorkout(userProfile, recommendedType, today);

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={showCompleteProfile} onOpenChange={setShowCompleteProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Let’s personalize your plan</DialogTitle>
            <DialogDescription>
              Choose your goal and experience level. You can refine more details anytime in Setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Primary Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose-weight">Lose Weight</SelectItem>
                  <SelectItem value="build-muscle">Build Muscle</SelectItem>
                  <SelectItem value="stay-fit">Stay Fit</SelectItem>
                  <SelectItem value="improve-endurance">Improve Endurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience Level</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <div className="w-full grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link to="/setup">More Options</Link>
              </Button>
              <Button onClick={saveBasics} disabled={saving || !goal || !experience}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-heading text-3xl">
              WELCOME BACK, {userProfile?.displayName?.toUpperCase() || "FITNESS WARRIOR"}!
            </h1>
            <p className="text-white/90">Ready for today's challenge?</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              <Link to="/profile">
                <User className="w-4 h-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today's Workout</TabsTrigger>
            <TabsTrigger value="progress">Weekly Progress</TabsTrigger>
            <TabsTrigger value="motivation">Daily Quote</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Today's Workout Tab */}
          <TabsContent value="today" className="space-y-6">
            {/* Water Intake Tracker */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-500" />
                  WATER INTAKE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">{waterIntake}/{waterGoal}</div>
                      <div className="text-sm text-muted-foreground">glasses today</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateWaterIntake(-1)}
                        disabled={waterIntake === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateWaterIntake(1)}
                        disabled={waterIntake >= waterGoal}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={(waterIntake / waterGoal) * 100} className="h-3" />
                  {waterIntake >= waterGoal ? (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 text-center animate-pulse">
                      <p className="text-lg font-bold text-blue-800 mb-1">
                        🎉 Great job! You're fully hydrated today! Stay refreshed 💧
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm font-semibold text-blue-700">
                        💧 Keep going! {waterGoal - waterIntake} {waterGoal - waterIntake === 1 ? 'glass' : 'glasses'} to go!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  TODAY'S WORKOUT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-heading text-xl mb-4">RECOMMENDED FOR YOU</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{todaysWorkout.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={`${getDifficultyColor(todaysWorkout.difficulty)} border-current`}
                            >
                              {getDifficultyLabel(todaysWorkout.difficulty)}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{todaysWorkout.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {todaysWorkout.description}
                        </p>
                        <div className="flex gap-2">
                          <Button asChild variant="default" className="flex-1">
                            <Link to={`/daily-workout?type=${recommendedType}`}>Start Workout</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-heading text-xl mb-4">QUICK OPTIONS</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=quickie">
                          <span className="font-semibold">Quickie</span>
                          <span className="text-xs">5-10 min</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=classic">
                          <span className="font-semibold">Classic</span>
                          <span className="text-xs">20-30 min</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=power">
                          <span className="font-semibold">Power</span>
                          <span className="text-xs">45-60 min</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-16 flex-col">
                        <Link to="/daily-workout?type=beast">
                          <span className="font-semibold">Beast</span>
                          <span className="text-xs">1.5+ hrs</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  WEEKLY CHALLENGE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Week Progress</span>
                      <span className="text-sm text-muted-foreground">{weeklyProgress}/{weeklyGoal} days completed</span>
                    </div>
                    <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {weekProgressDays.map((dayInfo) => (
                      <div 
                        key={dayInfo.day} 
                        className={`p-3 text-center rounded-lg transition-all duration-300 ${
                          dayInfo.completed
                            ? 'bg-primary text-primary-foreground shadow-lg' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-xs font-medium">{dayInfo.day}</div>
                        <div className="text-xl">
                          {dayInfo.completed ? '✓' : '○'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{totalWorkouts}</div>
                      <div className="text-sm text-muted-foreground">Total Workouts</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{totalHours}hrs</div>
                      <div className="text-sm text-muted-foreground">Time Trained</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{currentStreak} 🔥</div>
                      <div className="text-sm text-muted-foreground">Day Streak</div>
                    </div>
                  </div>
                  
                  {/* Weekly Chart - Uses same unified data as weekProgressDays */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">This Week's Activity</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 1]} />
                        <Tooltip 
                          formatter={(value: number) => value === 1 ? 'Workout completed' : 'No workout'}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="workouts" fill="#FF7A00" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Quote Tab */}
          <TabsContent value="motivation" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Quote className="w-6 h-6 text-primary" />
                  DAILY MOTIVATION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  <blockquote className="text-2xl font-medium text-foreground italic">
                    "{todaysQuote}"
                  </blockquote>
                  <div className="flex justify-center">
                    <Button variant="hero" onClick={handleShareQuote}>Share Quote</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Download className="w-6 h-6 text-primary" />
                  DOWNLOADABLE RESOURCES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Workout Tracker PDF</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Print-friendly workout log to track your progress offline
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownloadWorkoutTracker}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Nutrition Guide</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Personalized meal planning and macro tracking guide
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownloadNutritionGuide}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Exercise Form Guide</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Visual guide for proper exercise technique and safety
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownloadExerciseFormGuide}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:shadow-card transition-smooth">
                    <h4 className="font-semibold mb-2">Goal Setting Worksheet</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      SMART goals template for fitness and health objectives
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownloadGoalWorksheet}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;