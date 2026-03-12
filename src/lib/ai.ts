// Simple AI abstraction for the Gym Coach.
// If VITE_AI_ENDPOINT is set, it will POST the chat to that endpoint and expect { reply }.
// Otherwise, it will return a local heuristic response suitable for fitness coaching.

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `System Role: You are an AI Fitness Coach integrated into a gym website.

Functionality:
1. You must act as a personalized fitness assistant.
2. You do not generate random or unrelated answers. You only use the user’s gym progress data stored on the website.
3. The progress data includes workout history, completed sessions, weight tracking, diet logs, and goals.
4. When the user asks fitness questions, provide advice strictly tailored to their recorded progress and goals.
5. If a question is outside the scope of their personal data, politely explain that you can only respond based on stored progress and suggest consulting an external professional resource.

Features to Implement in Chatbot:
- Show last completed workout and suggest the next one.
- Display progress over time (e.g., “You’ve improved your bench press by 10 kg in 4 weeks”).
- Remind the user of upcoming goals or missed targets.
- Provide motivational tips using their personal progress.

Tone and Style:
- Be concise, encouraging, and specific.
- Avoid medical claims; recommend consulting a professional for injuries or conditions.
- Use short bullet points when listing items.
`;

export type ProfileContext = {
  displayName?: string | null;
  age?: number | null;
  gender?: string | null;
  height?: number | null; // cm
  weight?: number | null; // kg
  fitnessGoal?: string | null;
  experienceLevel?: string | null;
  preferredWorkoutTime?: string | null;
} | null;

export type ProgressContext = {
  lastCompleted?: {
    dateISO?: string;
    workoutType?: string;
    workoutId?: string;
    duration?: string;
    calories?: string;
  } | null;
  nextSuggestion?: {
    dayIndex?: number;
    typeKey?: string;
    workoutId?: string;
    name?: string;
    duration?: string;
    difficultyLabel?: string;
  } | null;
  weeklyCompletions?: number;
  weeklyGoal?: number;
  totalCompletions?: number;
  weightProgress?: {
    startKg?: number;
    currentKg?: number;
    changeKg?: number;
    weeks?: number;
  } | null;
  notableImprovements?: string[];
} | null;

export async function askAICoach(
  userInput: string,
  history: ChatMessage[],
  profile: ProfileContext,
  progress?: ProgressContext
): Promise<string> {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  const profileNote = profile
    ? `User profile (if available): name=${profile.displayName ?? ""}, age=${
        profile.age ?? ""
      }, gender=${profile.gender ?? ""}, height_cm=${profile.height ?? ""}, weight_kg=${
        profile.weight ?? ""
      }, goal=${profile.fitnessGoal ?? ""}, experience=${
        profile.experienceLevel ?? ""
      }, preferred_time=${profile.preferredWorkoutTime ?? ""}. Use this to tailor advice.`
    : "";
  const progressNote = progress ? `\nProgress data (strictly rely on this): ${JSON.stringify(progress)}` : "";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT + (profileNote ? `\n${profileNote}` : "") + progressNote },
    ...history,
    { role: "user", content: userInput },
  ];

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error(`AI endpoint error ${res.status}`);
      const data = await res.json();
      if (typeof data.reply === "string" && data.reply.trim().length > 0) {
        return data.reply.trim();
      }
    } catch (e) {
      // Fall back to local response below
    }
  }

  // Local heuristic fallback (works without server or API key)
  return localCoachFallback(userInput, profile, progress ?? null);
}

// Calculate TDEE for diet recommendations
function calculateTDEE(profile: ProfileContext): number | null {
  if (!profile?.weight || !profile?.height || !profile?.age || !profile?.gender) return null;
  
  let bmr: number;
  if (profile.gender === "male") {
    bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }
  
  return Math.round(bmr * 1.55); // Moderate activity
}

// Get diet recommendations based on goal
function getDietRecommendations(profile: ProfileContext, tdee: number | null): string {
  if (!tdee || !profile?.fitnessGoal) return "";
  
  const goal = profile.fitnessGoal;
  const name = profile.displayName || "there";
  
  // Normalize goal format (handle both "lose-weight" and "weight_loss")
  const normalizedGoal = goal === "lose-weight" ? "weight_loss" : 
                         goal === "build-muscle" ? "muscle_gain" :
                         goal === "improve-endurance" ? "endurance" :
                         goal === "stay-fit" ? "general" : goal;
  
  if (normalizedGoal === "weight_loss") {
    const deficit = tdee - 500;
    return [
      `🥗 Hey ${name}! For weight loss, aim for ${deficit} calories/day (500 cal deficit).`,
      "",
      "📋 Daily Meal Plan:",
      "• Breakfast: 2 boiled eggs + 1 bowl oats with milk (400 kcal)",
      "• Lunch: 1 cup brown rice + dal + 1 cup vegetables + 100g chicken/paneer (500 kcal)",
      "• Dinner: 1 roti + sabzi + salad (350 kcal)",
      "• Snack: 1 apple + 10 almonds (150 kcal)",
      "",
      "💡 Tips: Focus on protein (1.2g/kg), reduce refined carbs, stay hydrated!",
    ].join("\n");
  }
  
  if (normalizedGoal === "muscle_gain") {
    const surplus = tdee + 300;
    const protein = Math.round((profile.weight || 70) * 1.8);
    return [
      `💪 ${name}, for muscle gain, target ${surplus} calories/day (+300 cal surplus).`,
      "",
      "📋 Daily Meal Plan:",
      `• Breakfast: 3 eggs + 2 slices bread + 1 banana (500 kcal, 30g protein)`,
      `• Lunch: 1.5 cups rice + dal + 150g chicken/paneer + vegetables (650 kcal, 45g protein)`,
      `• Post-workout: 1 scoop whey + 1 banana smoothie (250 kcal, 25g protein)`,
      `• Dinner: 2 rotis + sabzi + 200g chicken/paneer (550 kcal, 40g protein)`,
      `• Snack: 40g paneer + 1 glass milk (200 kcal, 15g protein)`,
      "",
      `💡 Aim for ${protein}g protein daily, spread across meals!`,
    ].join("\n");
  }
  
  if (normalizedGoal === "endurance") {
    return [
      `🏃 ${name}, for endurance, balance carbs and hydration!`,
      "",
      "📋 Daily Meal Plan:",
      "• Breakfast: Oats + banana + honey (450 kcal)",
      "• Pre-workout: 1 banana + dates (200 kcal)",
      "• Post-workout: Rice + dal + vegetables (500 kcal)",
      "• Dinner: Roti + sabzi + yogurt (400 kcal)",
      "",
      "💡 Stay hydrated (3-4L water), include complex carbs, moderate protein!",
    ].join("\n");
  }
  
  return "";
}

// Calculate days since last workout
function getDaysSinceLastWorkout(progress: ProgressContext): number | null {
  if (!progress?.lastCompleted?.dateISO) return null;
  const lastDate = new Date(progress.lastCompleted.dateISO);
  const now = new Date();
  const diffTime = now.getTime() - lastDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function localCoachFallback(input: string, profile: ProfileContext, progress: ProgressContext): string {
  const text = input.toLowerCase();
  const p = profile || {};
  const goalHint = p.fitnessGoal ? `Goal: ${p.fitnessGoal}. ` : "";
  const xp = p.experienceLevel ? `Experience: ${p.experienceLevel}. ` : "";
  const hasProgress = !!progress && (!!progress.lastCompleted || typeof progress.weeklyCompletions === "number");
  const tdee = calculateTDEE(p);
  const daysSinceLast = getDaysSinceLastWorkout(progress || null);

  // Smart greeting with inactivity detection
  if (/(hi|hello|hey|greetings)/.test(text) && !hasProgress) {
    return `Hey ${p.displayName || "there"}! 👋 I'm your AI fitness coach. Complete your profile and log workouts to get personalized guidance!`;
  }
  
  if (/(hi|hello|hey|greetings)/.test(text) && hasProgress) {
    const name = p.displayName || "there";
    const weekly = progress?.weeklyCompletions || 0;
    const total = progress?.totalCompletions || 0;
    let greeting = `Hi ${name}! 👋`;
    
    if (daysSinceLast !== null && daysSinceLast > 3) {
      greeting += ` You've been away for ${daysSinceLast} days. Let's get back on track! 💪`;
    } else if (weekly > 0) {
      greeting += ` Great work this week - ${weekly} workouts completed! 🔥`;
    }
    
    greeting += ` You've done ${total} total workouts. How can I help today?`;
    return greeting;
  }

  // Diet/Nutrition queries
  if (/(diet|nutrition|food|meal|eat|calorie|macro|protein|carbs)/.test(text)) {
    if (!tdee) {
      return "Please complete your profile (age, weight, height, gender) to get personalized diet recommendations!";
    }
    const dietPlan = getDietRecommendations(p, tdee);
    if (dietPlan) return dietPlan;
    return "I can help with diet plans! What's your fitness goal? (weight loss, muscle gain, endurance)";
  }

  // Enforce stored-data-only constraint when nothing stored
  if (!hasProgress && !p.fitnessGoal && !p.experienceLevel) {
    return [
      "I can only respond based on your stored progress.",
      "Please complete your profile and log workouts to receive tailored advice.",
    ].join("\n");
  }

  if ((/(beginner|new|start)/.test(text) && /(workout|plan|gym)/.test(text)) || p.experienceLevel === "beginner") {
    return [
      `${goalHint}${xp}Beginner full-body (3x/week):`,
      "- Squat 3x8-10 (rest 90s)",
      "- Push-ups 3x8-12 (knees if needed)",
      "- Dumbbell row 3x10-12",
      "- Plank 3x30-45s",
      "Progress: add 1-2 reps or small weight weekly.",
      "How many days per week can you train?",
    ].join("\n");
  }

  if (/(lose|fat|weight)/.test(text)) {
    return [
      `${goalHint}${xp}Fat loss focus:`,
      "- 3 strength days: compound lifts 3x8-12",
      "- 2 cardio days: 20-30 min brisk walk or intervals",
      "- Daily steps: 7k-10k",
      "- Nutrition: small calorie deficit, prioritize protein",
      "Any injuries or equipment limits?",
    ].join("\n");
  }

  if (/(muscle|mass|hypertrophy|bulk)/.test(text)) {
    return [
      `${goalHint}${xp}Muscle gain basics:`,
      "- 4-day split (upper/lower): 3-4 sets x 6-12 reps",
      "- Progressively overload weekly",
      "- Protein ~1.6-2.2 g/kg, slight calorie surplus",
      "- Sleep 7-9h, track lifts",
      "Which muscle group would you like to prioritize?",
    ].join("\n");
  }

  if (/(shoulder|knee|back|pain|injury)/.test(text)) {
    return [
      "Safety first:",
      "- Avoid painful ranges and heavy loading",
      "- Swap to low-impact options (e.g., leg press for squats if knees)",
      "- Light mobility and controlled tempo",
      "Consider a professional evaluation for specific injuries.",
      "What movement hurts and at what intensity?",
    ].join("\n");
  }

  // Intent: how many workouts/sessions/days
  if (/(how\s+many|how\s+much|number|count).*(workout|session|day)/.test(text)) {
    const weekly = typeof progress?.weeklyCompletions === "number" ? progress!.weeklyCompletions : undefined;
    const total = typeof progress?.totalCompletions === "number" ? progress!.totalCompletions : undefined;
    const lines: string[] = [];
    lines.push(`${goalHint}${xp}Your training counts:`.trim());
    if (weekly !== undefined) lines.push(`- This week: ${weekly}/${progress?.weeklyGoal ?? 7} sessions`);
    if (total !== undefined) lines.push(`- All-time completed sessions: ${total}`);
    if (lines.length === 1) {
      lines.push("I couldn't find stored sessions. Log a workout to get started.");
    }
    return lines.join("\n");
  }

  // Intent: last workout
  if (/(last|previous).*(workout|session)/.test(text)) {
    if (progress?.lastCompleted) {
      const last = progress.lastCompleted;
      return [
        `${goalHint}${xp}Your last workout:`,
        `- Type: ${last.workoutType ?? "unknown"}`,
        last.dateISO ? `- Date: ${last.dateISO.slice(0,10)}` : undefined,
        last.duration ? `- Duration: ${last.duration}` : undefined,
        last.calories ? `- Calories: ${last.calories}` : undefined,
        progress.nextSuggestion ? `Next up: ${progress.nextSuggestion.name} (${progress.nextSuggestion.duration ?? ""})` : undefined,
      ].filter(Boolean).join("\n");
    }
    return "I couldn't find a last completed workout in your data.";
  }

  // Intent: next workout
  if (/(next|tomorrow).*(workout|session|plan)/.test(text)) {
    if (progress?.nextSuggestion) {
      const n = progress.nextSuggestion;
      return [
        `${goalHint}${xp}Your next suggested workout:`,
        `- ${n.name ?? "Planned workout"} (${n.duration ?? ""})`,
        p.preferredWorkoutTime ? `- Preferred time: ${p.preferredWorkoutTime}` : undefined,
        typeof progress?.weeklyCompletions === "number" ? `This week so far: ${progress!.weeklyCompletions}/${progress!.weeklyGoal ?? 7}` : undefined,
      ].filter(Boolean).join("\n");
    }
    return "I couldn't compute your next workout from stored data.";
  }

  // Intent: progress summary
  if (/(progress|improve|trend|stats)/.test(text)) {
    const lines: string[] = [];
    lines.push(`${goalHint}${xp}Your progress snapshot:`.trim());
    if (typeof progress?.weeklyCompletions === "number") {
      lines.push(`- Weekly sessions: ${progress.weeklyCompletions}/${progress.weeklyGoal ?? 7}`);
    }
    if (typeof progress?.totalCompletions === "number") {
      lines.push(`- All-time sessions: ${progress.totalCompletions}`);
    }
    if (progress?.weightProgress && typeof progress.weightProgress.changeKg === "number") {
      lines.push(`- Weight change: ${progress.weightProgress.changeKg} kg over ${progress.weightProgress.weeks ?? "?"} weeks`);
    }
    if (progress?.notableImprovements?.length) {
      lines.push(`- Improvements: ${progress.notableImprovements.join(", ")}`);
    }
    if (lines.length === 1) {
      lines.push("No progress data yet. Log workouts to track trends.");
    }
    return lines.join("\n");
  }

  // Progress-based default response with enhanced context
  const lines: string[] = [];
  const name = p.displayName || "there";
  lines.push(`Hey ${name}! 👋 Here's your progress snapshot:`);
  lines.push("");
  
  if (progress?.lastCompleted) {
    const lastDate = progress.lastCompleted.dateISO?.slice(0,10);
    const calories = progress.lastCompleted.calories || "N/A";
    lines.push(`📅 Last workout: ${progress.lastCompleted.workoutType ?? "workout"} on ${lastDate}`);
    lines.push(`   Duration: ${progress.lastCompleted.duration || "N/A"} | Calories: ${calories}`);
  }
  
  if (typeof progress?.weeklyCompletions === "number") {
    const weekly = progress.weeklyCompletions;
    const goal = progress.weeklyGoal ?? 7;
    const percent = Math.round((weekly / goal) * 100);
    lines.push(`📊 This week: ${weekly}/${goal} sessions (${percent}% complete)`);
    
    if (weekly >= goal) {
      lines.push(`   🎉 Amazing! You've hit your weekly goal!`);
    } else if (weekly >= goal * 0.7) {
      lines.push(`   💪 Great progress! Keep it up!`);
    } else {
      lines.push(`   💡 ${goal - weekly} more sessions to reach your goal!`);
    }
  }
  
  if (typeof progress?.totalCompletions === "number") {
    lines.push(`🏆 Total workouts: ${progress.totalCompletions} sessions completed`);
  }
  
  if (progress?.weightProgress && typeof progress.weightProgress.changeKg === "number") {
    const change = progress.weightProgress.changeKg;
    const emoji = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";
    lines.push(`${emoji} Weight change: ${Math.abs(change)} kg over ${progress.weightProgress.weeks ?? "?"} weeks`);
  }
  
  if (progress?.nextSuggestion) {
    lines.push("");
    lines.push(`🎯 Next workout: ${progress.nextSuggestion.name ?? "Planned workout"} (${progress.nextSuggestion.duration ?? ""})`);
  }
  
  // Add diet hint if goal is set
  if (p.fitnessGoal && tdee) {
    lines.push("");
    lines.push(`💡 Ask me about "diet" or "nutrition" for personalized meal plans!`);
  }
  
  lines.push("");
  lines.push(`What would you like to know? Try: "diet plan", "next workout", or "progress"`);
  return lines.join("\n");
}


