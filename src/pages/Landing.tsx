import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Target, TrendingUp, Zap, Dumbbell, Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-fitness.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mt-6 rounded-full border border-white/30 bg-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/10 flex items-center justify-between px-6 py-3 text-white">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                <Dumbbell className="h-5 w-5 text-white" />
              </span>
              <span className="font-heading text-2xl tracking-wide">FitLine-Gym</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="hover:underline">Features</a>
              <a href="#testimonials" className="hover:underline">Success Stories</a>
              <a href="#cta" className="hover:underline">Get Started</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/auth?mode=signup">Join Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90 z-10" />
        <img 
          src={heroImage} 
          alt="FitLine-Gym Fitness" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/30 text-white backdrop-blur mb-5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 animate-float">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm">Smarter workouts. Faster results.</span>
          </div>

          <h1 className="font-heading text-6xl md:text-8xl text-white mb-4 leading-tight">
            No Excuses. Just Results.
          </h1>
          <p className="text-2xl md:text-3xl text-white mb-2 font-light">
            No time? No problem.
          </p>
          <p className="text-xl md:text-2xl text-white/90 mb-10 font-medium">
            Daily fitness in minutes with your AI Coach.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="hero" size="lg" className="text-lg px-8 py-6">
              <Link to="/auth?mode=signup">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-300" />
              <span>Trusted by 5k+ users</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/40" />
            <div className="hidden sm:flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>5–60 min guided sessions</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center">
          <div className="text-white/80 text-sm">Scroll</div>
        </div>
      </section>

      {/* Logo/Trust Marquee */}
      <section className="py-6 marquee bg-background/60">
        <div className="marquee-content px-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-2 text-muted-foreground">
              <Dumbbell className="h-5 w-5 text-foreground/70" />
              <span className="uppercase tracking-widest text-sm">FitLine Community</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-6xl text-center mb-16 text-foreground">
            WHY FitLine-Gym?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">QUICK WORKOUTS</h3>
                <p className="text-muted-foreground">5-60 minute workouts that fit your schedule</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">AI COACH</h3>
                <p className="text-muted-foreground">Personal AI guidance and motivation 24/7</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">DAILY GOALS</h3>
                <p className="text-muted-foreground">Achieve consistent progress with daily challenges</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-hero transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl mb-4 text-foreground">TRACK PROGRESS</h3>
                <p className="text-muted-foreground">Visual insights into your fitness journey</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <Button asChild variant="hero" size="lg" className="text-lg px-12 py-6">
              <Link to="/auth?mode=signup">Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl text-center mb-12">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {["Lost 8kg in 6 weeks", "Finally consistent", "Energy all day"].map((headline, i) => (
              <Card key={i} className="border-0 shadow-card hover:shadow-hero transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-foreground">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-white">
                      <Quote className="h-4 w-4" />
                    </span>
                    <div className="font-semibold">{headline}</div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    “The AI coach keeps me on track even on busy days. Short sessions, big impact.”
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center font-semibold">{"AB"[i] ?? "US"}</div>
                    <div>
                      <div className="text-sm font-medium">Member #{100 + i}</div>
                      <div className="text-xs text-muted-foreground">FitLine Community</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section id="cta" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-hero shadow-hero text-white">
            <div className="px-8 md:px-12 py-14 text-center">
              <h3 className="font-heading text-4xl md:text-5xl mb-3">Your best shape starts today</h3>
              <p className="text-white/90 text-lg md:text-xl mb-8">Sign up free. No equipment required.</p>
              <div className="flex justify-center">
                <Button asChild variant="hero" size="lg" className="text-lg px-10 py-6">
                  <Link to="/auth?mode=signup">Create Your Plan</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-background border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary">
              <Dumbbell className="h-4 w-4 text-white" />
            </span>
            <span className="font-heading text-xl">FitLine-Gym</span>
          </div>
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} FitLine. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;