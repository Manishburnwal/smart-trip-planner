import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, MapPin, Sparkles, Calendar, DollarSign, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Itineraries",
    description: "Get personalized day-by-day plans crafted by AI based on your interests, budget, and travel style.",
  },
  {
    icon: MapPin,
    title: "Interactive Maps",
    description: "See all your stops on an interactive map with optimized routes and distance estimates.",
  },
  {
    icon: DollarSign,
    title: "Smart Budgeting",
    description: "Real-time budget breakdown with cost estimates and cheaper alternatives when you need them.",
  },
  {
    icon: Calendar,
    title: "Weather-Aware Plans",
    description: "Itineraries adapt to weather forecasts with backup activities for rainy days.",
  },
  {
    icon: Share2,
    title: "Share & Export",
    description: "Share trips with a public link or download a beautiful PDF for offline access.",
  },
  {
    icon: Plane,
    title: "Travel Styles",
    description: "Solo, couple, friends, or family — plans tailored to how you travel.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">TripCopilot</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild className="gradient-primary border-0">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="gradient-primary border-0">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute -top-60 -right-60 h-[600px] w-[600px] rounded-full gradient-primary opacity-15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-accent opacity-10 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI-Powered Travel Planning
            </div>

            <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Plan your perfect trip with{" "}
              <span className="gradient-text">AI intelligence</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Tell us where you want to go, your budget, and interests. Our AI creates
              a complete day-by-day itinerary with maps, weather, and local tips.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="gradient-primary border-0 px-8 text-base shadow-lg shadow-primary/25"
              >
                <Link to={user ? "/create-trip" : "/auth"}>
                  Start Planning <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-8 text-base">
                <Link to={user ? "/dashboard" : "/auth"}>View Demo Trips</Link>
              </Button>
            </div>
          </motion.div>

          {/* Floating icons */}
          <div className="pointer-events-none absolute inset-0">
            <MapPin className="absolute left-[10%] top-[20%] h-8 w-8 text-primary/20 animate-float" />
            <Plane className="absolute right-[15%] top-[30%] h-6 w-6 text-accent/30 animate-float" style={{ animationDelay: "1s" }} />
            <Calendar className="absolute left-[20%] bottom-[25%] h-7 w-7 text-primary/15 animate-float" style={{ animationDelay: "2s" }} />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything you need for the{" "}
              <span className="gradient-text">perfect trip</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              From AI-generated itineraries to live weather and interactive maps — all in one place.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 text-center text-primary-foreground md:p-20">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative z-10 font-display text-3xl font-bold md:text-5xl">
              Ready to plan your next adventure?
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-lg text-primary-foreground/80">
              Join thousands of travelers using AI to create unforgettable trips.
            </p>
            <Button
              asChild
              size="lg"
              className="relative z-10 mt-8 bg-white text-foreground hover:bg-white/90 px-8 text-base"
            >
              <Link to={user ? "/create-trip" : "/auth"}>
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">TripCopilot</span>
          </div>
          <p>© 2026 AI Trip Copilot. Built with ❤️</p>
        </div>
      </footer>
    </div>
  );
}
