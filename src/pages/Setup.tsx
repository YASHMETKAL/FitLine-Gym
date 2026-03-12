import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const Setup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    goal: "",
    experience: "",
    timePreference: "",
    workoutDays: "",
  });
  
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await saveProfile();
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);
      const payload: {
        displayName: string | null;
        age: number | null;
        gender: string | null;
        height: number | null;
        weight: number | null;
        fitnessGoal: string | null;
        experienceLevel: string | null;
        preferredWorkoutTime: string | null;
        intensityLevel: string | null;
        updatedAt: ReturnType<typeof serverTimestamp>;
      } = {
        displayName: formData.name || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        fitnessGoal: formData.goal || null,
        experienceLevel: formData.experience || null,
        preferredWorkoutTime: formData.timePreference || null,
        intensityLevel: formData.workoutDays || null,
        updatedAt: serverTimestamp(),
      };

      if (!existing.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: formData.name || user.displayName,
          createdAt: serverTimestamp(),
          ...payload,
        });
      } else {
        await updateDoc(userRef, payload);
      }

      await refreshProfile();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl mb-2">BASIC INFO</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter your name" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age" 
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateFormData("age", e.target.value)}
                    placeholder="25" 
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl mb-2">MEASUREMENTS</h2>
              <p className="text-muted-foreground">Your current stats</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input 
                  id="height" 
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateFormData("height", e.target.value)}
                  placeholder="170" 
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input 
                  id="weight" 
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateFormData("weight", e.target.value)}
                  placeholder="70" 
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl mb-2">FITNESS GOALS</h2>
              <p className="text-muted-foreground">What do you want to achieve?</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Primary Goal</Label>
                <Select value={formData.goal} onValueChange={(value) => updateFormData("goal", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your main goal" />
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
                <Select value={formData.experience} onValueChange={(value) => updateFormData("experience", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Your fitness experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl mb-2">PREFERENCES</h2>
              <p className="text-muted-foreground">Customize your routine</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Preferred Workout Time</Label>
                <Select value={formData.timePreference} onValueChange={(value) => updateFormData("timePreference", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="When do you prefer to workout?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quickie">Quickie (5-10 min)</SelectItem>
                    <SelectItem value="classic">Classic (20-30 min)</SelectItem>
                    <SelectItem value="power">Power (45-60 min)</SelectItem>
                    <SelectItem value="beast">Beast Mode (1.5+ hrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Workout Days per Week</Label>
                <Select value={formData.workoutDays} onValueChange={(value) => updateFormData("workoutDays", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="4">4 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="6">6 days</SelectItem>
                    <SelectItem value="7">Every day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl mb-2">REVIEW</h2>
              <p className="text-muted-foreground">Confirm your details</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p><strong>Name:</strong> {formData.name || "Not set"}</p>
                <p><strong>Age:</strong> {formData.age || "Not set"}</p>
                <p><strong>Goal:</strong> {formData.goal || "Not set"}</p>
                <p><strong>Time Preference:</strong> {formData.timePreference || "Not set"}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="font-heading text-4xl mb-4">SETUP YOUR PROFILE</h1>
          <Progress value={progress} className="max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader></CardHeader>
          <CardContent className="p-8">
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button 
                onClick={handleNext}
                variant={currentStep === totalSteps ? "success" : "default"}
                disabled={loading}
              >
                {loading ? "Saving..." : (currentStep === totalSteps ? "Complete Setup" : "Next")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;