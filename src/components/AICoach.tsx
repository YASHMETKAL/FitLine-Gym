import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Zap } from "lucide-react";
import { askAICoach, type ChatMessage, type ProgressContext } from "@/lib/ai";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getPersonalizedWorkout, getRecommendedWorkoutType, workoutTypes } from "@/lib/workouts";

export const AICoach = () => {
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<ProgressContext | null>(null);

  type Bubble = { type: "user" | "ai"; content: string };
  const [messages, setMessages] = useState<Bubble[]>([
    {
      type: "ai",
      content:
        "Hey there! 💪 I'm your AI fitness coach. Ask about workouts, plans, nutrition basics, or form cues.",
    },
  ]);

  const chatHistory: ChatMessage[] = useMemo(() => {
    return messages
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({ role: m.type === "ai" ? "assistant" : "user", content: m.content }));
  }, [messages]);

  // Fetch comprehensive progress context: last completion, weekly count, calories, etc.
  useEffect(() => {
    const run = async () => {
      try {
        if (!userProfile || !('uid' in userProfile)) return;
        const uid = userProfile.uid;

        // Last completed workout
        const completionsRef = collection(db, "users", uid, "completions");
        const lastQ = query(completionsRef, orderBy("date", "desc"), limit(1));
        const lastSnap = await getDocs(lastQ);
        const lastDoc = lastSnap.docs[0];
        const lastCompleted = lastDoc
          ? {
              dateISO: (lastDoc.data().date?.toDate?.() ?? new Date(lastDoc.data().date)).toISOString(),
              workoutType: lastDoc.data().workoutType,
              workoutId: lastDoc.data().workoutId,
              duration: lastDoc.data().duration,
              calories: lastDoc.data().calories,
            }
          : null;

        // Weekly completions (Mon-Sun local) and calculate total calories
        const now = new Date();
        const day = (now.getDay() + 6) % 7; // Mon=0
        const monday = new Date(now);
        monday.setDate(now.getDate() - day);
        monday.setHours(0,0,0,0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        const weeklySnap = await getDocs(completionsRef);
        let weeklyCompletions = 0;
        let totalCompletions = 0;
        let weeklyCalories = 0;
        
        weeklySnap.forEach(d => {
          const dt = d.data().date?.toDate?.() ?? new Date(d.data().date);
          if (d.data().completed) {
            totalCompletions += 1;
            // Parse calories (e.g., "200-300 calories" -> take average)
            const calStr = d.data().calories || "";
            const calMatch = calStr.match(/(\d+)(?:\s*-\s*(\d+))?/);
            if (calMatch) {
              const min = parseInt(calMatch[1], 10);
              const max = calMatch[2] ? parseInt(calMatch[2], 10) : min;
              const avg = Math.round((min + max) / 2);
              if (dt >= monday && dt <= sunday) {
                weeklyCalories += avg;
                weeklyCompletions += 1;
              }
            }
          }
        });

        // Next suggestion based on rotation
        const typeKey = getRecommendedWorkoutType(userProfile);
        const today = new Date().getDay();
        const nextDay = (today + 1) % 7;
        const nextW = getPersonalizedWorkout(userProfile, typeKey, nextDay);

        setProgress({
          lastCompleted,
          nextSuggestion: {
            dayIndex: nextDay,
            typeKey,
            workoutId: nextW.id,
            name: nextW.name,
            duration: nextW.duration,
            difficultyLabel: undefined,
          },
          weeklyCompletions,
          totalCompletions,
          weeklyGoal: 7,
          notableImprovements: weeklyCalories > 0 ? [`Burned ~${weeklyCalories} calories this week`] : [],
        });
      } catch (e) {
        console.error("Failed to load progress context", e);
      }
    };
    run();
  }, [userProfile]);

  const handleSendMessage = async () => {
    const input = message.trim();
    if (!input || isThinking) return;
    setMessage("");
    setMessages((prev) => [...prev, { type: "user", content: input }]);
    setIsThinking(true);
    try {
      const reply = await askAICoach(input, chatHistory, userProfile, progress ?? undefined);
      setMessages((prev) => [...prev, { type: "ai", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "Sorry, I'm having trouble responding right now. Try again in a moment.",
        },
      ]);
    } finally {
      setIsThinking(false);
      // Scroll to bottom after response
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-glow hover:shadow-hero transition-smooth z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed left-3 right-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-80 h-[60vh] sm:h-96 max-h-[80vh] bg-gradient-card border-0 shadow-hero z-50 flex flex-col">
          <CardHeader className="bg-gradient-primary text-white rounded-t-lg p-4">
            <div className="flex justify-between items-center">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI COACH
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col flex-1 p-0 min-h-0">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg text-sm bg-muted text-foreground opacity-80">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about fitness..."
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  variant="default"
                  className="h-10 w-10 bg-primary hover:bg-primary/90"
                  disabled={isThinking}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {import.meta.env.VITE_AI_ENDPOINT ? 'Powered by your AI endpoint' : 'Running local coaching guidance'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};