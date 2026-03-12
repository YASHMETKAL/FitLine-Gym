import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
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

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          gender: data.gender,
          age: data.age,
          height: data.height,
          weight: data.weight,
          fitnessGoal: data.fitnessGoal,
          experienceLevel: data.experienceLevel,
          preferredWorkoutTime: data.preferredWorkoutTime,
          intensityLevel: data.intensityLevel,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const refreshProfile = async () => {
    // Since we have real-time listeners (onSnapshot), we don't need to manually fetch
    // The UI will automatically update when the document changes
    // This function is kept for backward compatibility but is now a no-op
    console.log("Profile refresh requested - real-time listener will handle updates automatically");
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        // Subscribe to real-time updates of the user's profile
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile({
                uid: data.uid ?? currentUser.uid,
                email: data.email ?? currentUser.email,
                displayName: data.displayName ?? currentUser.displayName,
                gender: data.gender,
                age: data.age,
                height: data.height,
                weight: data.weight,
                fitnessGoal: data.fitnessGoal,
                experienceLevel: data.experienceLevel,
                preferredWorkoutTime: data.preferredWorkoutTime,
                intensityLevel: data.intensityLevel,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              });
            } else {
              // Fallback to minimal profile from auth while document is missing
              setUserProfile({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                createdAt: new Date(),
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error subscribing to user profile:", error);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 