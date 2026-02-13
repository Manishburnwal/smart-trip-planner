import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plane, ArrowLeft, ArrowRight, MapPin, CalendarIcon, DollarSign,
  Heart, Users, Gauge, Check, Sparkles,
  UtensilsCrossed, Umbrella, Mountain, Theater, Moon, Coffee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const interests = [
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "beaches", label: "Beaches", icon: Umbrella },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "culture", label: "Culture", icon: Theater },
  { id: "nightlife", label: "Nightlife", icon: Moon },
  { id: "chill", label: "Chill", icon: Coffee },
];

const styles = [
  { id: "solo", label: "Solo" },
  { id: "couple", label: "Couple" },
  { id: "friends", label: "Friends" },
  { id: "family", label: "Family" },
];

const STEPS = ["Destination", "Dates", "Budget", "Interests", "Style", "Review"];

export default function CreateTrip() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numDays, setNumDays] = useState(3);
  const [budget, setBudget] = useState([5000, 30000]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState("solo");
  const [travelPace, setTravelPace] = useState("relaxed");

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const canNext = () => {
    if (step === 0) return destination.trim().length > 0;
    if (step === 1) return numDays > 0;
    if (step === 3) return selectedInterests.length > 0;
    return true;
  };

  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        destination,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        num_days: numDays,
        budget_min: budget[0],
        budget_max: budget[1],
        interests: selectedInterests,
        travel_style: travelStyle,
        travel_pace: travelPace,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create trip");
      setSaving(false);
      return;
    }

    toast.success("Trip created! Generating itinerary...");
    navigate(`/trip/${data.id}?generate=true`);
  };

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : numDays;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">New Trip</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="container mx-auto max-w-2xl px-4 py-10">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all
                  ${i < step ? "gradient-primary text-primary-foreground" : i === step ? "border-2 border-primary text-primary" : "border border-border text-muted-foreground"}`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <MapPin className="h-5 w-5 text-primary" /> Where are you going?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Goa, Manali, Bali..."
                    className="text-lg"
                    autoFocus
                  />
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <CalendarIcon className="h-5 w-5 text-primary" /> When are you traveling?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date (optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date (optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date < startDate : false} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Days</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[startDate && endDate ? days : numDays]}
                        onValueChange={([v]) => setNumDays(v)}
                        min={1}
                        max={14}
                        step={1}
                        disabled={!!(startDate && endDate)}
                        className="flex-1"
                      />
                      <span className="w-12 text-center font-display text-xl font-bold text-primary">
                        {startDate && endDate ? days : numDays}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <DollarSign className="h-5 w-5 text-primary" /> What's your budget?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget range (INR)</span>
                      <span className="font-semibold">
                        ₹{budget[0].toLocaleString()} – ₹{budget[1].toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={budget}
                      onValueChange={(v) => setBudget(v)}
                      min={1000}
                      max={200000}
                      step={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹1,000</span>
                      <span>₹2,00,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Heart className="h-5 w-5 text-primary" /> What interests you?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {interests.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => toggleInterest(id)}
                        className={`flex items-center gap-2 rounded-xl border-2 p-4 transition-all
                          ${selectedInterests.includes(id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/30"}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Users className="h-5 w-5 text-primary" /> Travel style & pace
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Who's traveling?</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {styles.map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => setTravelStyle(id)}
                          className={`rounded-xl border-2 p-3 text-center font-medium transition-all
                            ${travelStyle === id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" /> Travel Pace
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {["relaxed", "packed"].map((pace) => (
                        <button
                          key={pace}
                          onClick={() => setTravelPace(pace)}
                          className={`rounded-xl border-2 p-3 text-center font-medium capitalize transition-all
                            ${travelPace === pace ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"}`}
                        >
                          {pace}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Sparkles className="h-5 w-5 text-primary" /> Review your trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between rounded-lg bg-secondary p-3">
                      <span className="text-muted-foreground">Destination</span>
                      <span className="font-semibold">{destination}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-secondary p-3">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-semibold">{startDate && endDate ? days : numDays} days</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-secondary p-3">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-semibold">₹{budget[0].toLocaleString()} – ₹{budget[1].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-secondary p-3">
                      <span className="text-muted-foreground">Interests</span>
                      <span className="font-semibold">{selectedInterests.join(", ")}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-secondary p-3">
                      <span className="text-muted-foreground">Style</span>
                      <span className="font-semibold capitalize">{travelStyle} · {travelPace}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="gradient-primary border-0"
            >
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="gradient-primary border-0"
            >
              {saving ? "Creating..." : (
                <>
                  <Sparkles className="mr-1 h-4 w-4" /> Generate Itinerary
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
