import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, Edit3, Save, Target, TrendingUp, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { userProfile: authProfile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    experience: "",
    timePreference: "",
  });

  useEffect(() => {
    if (authProfile) {
      setUserProfile({
        name: authProfile.displayName || "",
        age: authProfile.age ? String(authProfile.age) : "",
        gender: (authProfile.gender as any) || "",
        height: authProfile.height ? String(authProfile.height) : "",
        weight: authProfile.weight ? String(authProfile.weight) : "",
        goal: (authProfile.fitnessGoal as any) || "",
        experience: (authProfile.experienceLevel as any) || "",
        timePreference: (authProfile.preferredWorkoutTime as any) || "",
      });
    }
  }, [authProfile]);

  const calculateBMI = () => {
    const heightM = parseFloat(userProfile.height) / 100;
    const weightKg = parseFloat(userProfile.weight);
    if (!heightM || !weightKg || heightM <= 0 || weightKg <= 0) return "0.0";
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "bg-blue-500" };
    if (bmi < 25) return { category: "Normal", color: "bg-green-500" };
    if (bmi < 30) return { category: "Overweight", color: "bg-yellow-500" };
    return { category: "Obese", color: "bg-red-500" };
  };

  const calculateCalories = () => {
    // Basic BMR calculation (Harris-Benedict)
    const age = parseInt(userProfile.age);
    const height = parseFloat(userProfile.height);
    const weight = parseFloat(userProfile.weight);
    
    if (!age || !height || !weight || age <= 0 || height <= 0 || weight <= 0) {
      return {
        maintenance: 0,
        deficit: 0,
        surplus: 0,
      };
    }
    
    let bmr;
    if (userProfile.gender === "male") {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Activity factor (moderate activity)
    const totalCalories = Math.round(bmr * 1.55);
    
    return {
      maintenance: totalCalories,
      deficit: totalCalories - 500, // For weight loss
      surplus: totalCalories + 300, // For muscle gain
    };
  };

  const bmi = parseFloat(calculateBMI());
  const bmiInfo = getBMICategory(bmi);
  const calories = calculateCalories();

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save changes.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Build proposed values from form
      const proposed: any = {
        displayName: userProfile.name || null,
        age: userProfile.age ? parseInt(userProfile.age) : null,
        gender: userProfile.gender || null,
        height: userProfile.height ? parseInt(userProfile.height) : null,
        weight: userProfile.weight ? parseFloat(userProfile.weight) : null,
        fitnessGoal: userProfile.goal || null,
        experienceLevel: userProfile.experience || null,
        preferredWorkoutTime: userProfile.timePreference || null,
      };

      // Current values from profile for diffing
      const current = {
        displayName: authProfile?.displayName ?? null,
        age: authProfile?.age ?? null,
        gender: (authProfile as any)?.gender ?? null,
        height: authProfile?.height ?? null,
        weight: authProfile?.weight ?? null,
        fitnessGoal: (authProfile as any)?.fitnessGoal ?? null,
        experienceLevel: (authProfile as any)?.experienceLevel ?? null,
        preferredWorkoutTime: (authProfile as any)?.preferredWorkoutTime ?? null,
      } as any;

      // Compute minimal update payload (skip nulls and unchanged)
      const updateData: any = {};
      Object.keys(proposed).forEach((key) => {
        const nextValue = proposed[key];
        if (nextValue !== null && nextValue !== current[key]) {
          updateData[key] = nextValue;
        }
      });

      // If nothing changed, exit quickly
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        toast({ title: "No changes", description: "Your profile is already up to date." });
        return;
      }

      // Add server timestamp
      updateData.updatedAt = serverTimestamp();

      // Optimistic UI: close edit mode before the network round-trip
      setIsEditing(false);

      // Upsert the document - auto-create if missing, merge if exists
      await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
      
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (field: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center text-white hover:text-white/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-heading text-4xl">MY PROFILE</h1>
              <p className="text-white/90">Manage your fitness journey</p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4 mr-2" />
              ) : (
                <Edit3 className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="health">Health Metrics</TabsTrigger>
            <TabsTrigger value="goals">Goals & Stats</TabsTrigger>
          </TabsList>

          {/* Profile Info Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" />
                  PERSONAL INFORMATION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input 
                          id="name"
                          value={userProfile.name}
                          onChange={(e) => updateProfile("name", e.target.value)}
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded">{userProfile.name || "Not set"}</div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="age">Age</Label>
                        {isEditing ? (
                          <Input 
                            id="age"
                            type="number"
                            value={userProfile.age}
                            onChange={(e) => updateProfile("age", e.target.value)}
                            disabled={isSaving}
                          />
                        ) : (
                          <div className="p-2 bg-muted rounded">{userProfile.age || "Not set"}</div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        {isEditing ? (
                          <Select 
                            value={userProfile.gender} 
                            onValueChange={(value) => updateProfile("gender", value)}
                            disabled={isSaving}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-2 bg-muted rounded capitalize">{userProfile.gender || "Not set"}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height">Height (cm)</Label>
                        {isEditing ? (
                          <Input 
                            id="height"
                            type="number"
                            value={userProfile.height}
                            onChange={(e) => updateProfile("height", e.target.value)}
                            disabled={isSaving}
                          />
                        ) : (
                          <div className="p-2 bg-muted rounded">{userProfile.height ? `${userProfile.height} cm` : "Not set"}</div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        {isEditing ? (
                          <Input 
                            id="weight"
                            type="number"
                            value={userProfile.weight}
                            onChange={(e) => updateProfile("weight", e.target.value)}
                            disabled={isSaving}
                          />
                        ) : (
                          <div className="p-2 bg-muted rounded">{userProfile.weight ? `${userProfile.weight} kg` : "Not set"}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="goal">Primary Goal</Label>
                      {isEditing ? (
                        <Select 
                          value={userProfile.goal} 
                          onValueChange={(value) => updateProfile("goal", value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lose-weight">Lose Weight</SelectItem>
                            <SelectItem value="build-muscle">Build Muscle</SelectItem>
                            <SelectItem value="stay-fit">Stay Fit</SelectItem>
                            <SelectItem value="improve-endurance">Improve Endurance</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-muted rounded capitalize">
                          {userProfile.goal ? userProfile.goal.replace('-', ' ') : "Not set"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Metrics Tab */}
          <TabsContent value="health" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-primary" />
                  HEALTH METRICS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* BMI Calculator */}
                  <div>
                    <h3 className="font-heading text-xl mb-4">BMI CALCULATOR</h3>
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-muted rounded-lg">
                        <div className="text-4xl font-bold text-primary mb-2">{calculateBMI()}</div>
                        {bmi > 0 && (
                          <Badge className={`${bmiInfo.color} text-white`}>
                            {bmiInfo.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>BMI Categories:</p>
                        <p>• Underweight: Below 18.5</p>
                        <p>• Normal: 18.5 - 24.9</p>
                        <p>• Overweight: 25 - 29.9</p>
                        <p>• Obese: 30 and above</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Calorie Calculator */}
                  <div>
                    <h3 className="font-heading text-xl mb-4">DAILY CALORIES</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Maintenance</span>
                          <span className="font-bold text-primary">{calories.maintenance} cal</span>
                        </div>
                        <p className="text-xs text-muted-foreground">To maintain current weight</p>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Weight Loss</span>
                          <span className="font-bold text-green-600">{calories.deficit} cal</span>
                        </div>
                        <p className="text-xs text-muted-foreground">For gradual weight loss</p>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Muscle Gain</span>
                          <span className="font-bold text-orange-600">{calories.surplus} cal</span>
                        </div>
                        <p className="text-xs text-muted-foreground">For lean muscle building</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals & Stats Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  FITNESS GOALS & PROGRESS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Current Goals */}
                  <div>
                    <h3 className="font-heading text-xl mb-4">CURRENT GOALS</h3>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Primary Goal</span>
                          <Badge variant="secondary">
                            {userProfile.goal ? userProfile.goal.replace('-', ' ') : "Not set"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Workout Preference: {userProfile.timePreference || "Not set"} sessions
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Experience Level</span>
                          <Badge variant="outline">{userProfile.experience || "Not set"}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Achievement Stats */}
                  <div>
                    <h3 className="font-heading text-xl mb-4">ACHIEVEMENTS</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Total Workouts</span>
                        <span className="text-2xl font-bold text-primary">127</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Days Active</span>
                        <span className="text-2xl font-bold text-primary">89</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Current Streak</span>
                        <span className="text-2xl font-bold text-primary">18</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Hours Trained</span>
                        <span className="text-2xl font-bold text-primary">45.2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Daily Nutrition Summary */}
            {calories.maintenance > 0 && userProfile.goal && (
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />
                    DAILY NUTRITION SUMMARY
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h4 className="font-semibold mb-3">Recommended Daily Intake: {calories.maintenance} calories</h4>
                      {(userProfile.goal === "lose-weight" || userProfile.goal === "weight_loss") && (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">🥗 Weight Loss Plan ({calories.deficit} cal/day):</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Breakfast: 2 boiled eggs + 1 bowl oats with milk (400 kcal)</li>
                            <li>Lunch: 1 cup brown rice + dal + vegetables + 100g chicken/paneer (500 kcal)</li>
                            <li>Dinner: 1 roti + sabzi + salad (350 kcal)</li>
                            <li>Snack: 1 apple + 10 almonds (150 kcal)</li>
                          </ul>
                        </div>
                      )}
                      {(userProfile.goal === "build-muscle" || userProfile.goal === "muscle_gain") && (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">💪 Muscle Gain Plan ({calories.surplus} cal/day):</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Breakfast: 3 eggs + 2 slices bread + 1 banana (500 kcal, 30g protein)</li>
                            <li>Lunch: 1.5 cups rice + dal + 150g chicken/paneer + vegetables (650 kcal, 45g protein)</li>
                            <li>Post-workout: 1 scoop whey + 1 banana smoothie (250 kcal, 25g protein)</li>
                            <li>Dinner: 2 rotis + sabzi + 200g chicken/paneer (550 kcal, 40g protein)</li>
                            <li>Snack: 40g paneer + 1 glass milk (200 kcal, 15g protein)</li>
                          </ul>
                        </div>
                      )}
                      {(userProfile.goal === "improve-endurance" || userProfile.goal === "endurance") && (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">🏃 Endurance Plan ({calories.maintenance} cal/day):</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Breakfast: Oats + banana + honey (450 kcal)</li>
                            <li>Pre-workout: 1 banana + dates (200 kcal)</li>
                            <li>Post-workout: Rice + dal + vegetables (500 kcal)</li>
                            <li>Dinner: Roti + sabzi + yogurt (400 kcal)</li>
                          </ul>
                        </div>
                      )}
                      {!["lose-weight", "build-muscle", "improve-endurance"].includes(userProfile.goal) && (
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">🥗 Balanced Plan ({calories.maintenance} cal/day):</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Breakfast: Whole grain cereal + milk + fruits (400 kcal)</li>
                            <li>Lunch: Balanced meal with protein, carbs, and vegetables (500 kcal)</li>
                            <li>Dinner: Light meal with vegetables and lean protein (400 kcal)</li>
                            <li>Snack: Nuts or fruits (200 kcal)</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;