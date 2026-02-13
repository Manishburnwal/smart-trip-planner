import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin, Calendar, DollarSign, Plane, LogOut, Trash2, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Trip = Tables<"trips">;

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load trips");
    } else {
      setTrips(data || []);
    }
    setLoading(false);
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete trip");
    } else {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trip deleted");
    }
  };

  const duplicateTrip = async (trip: Trip) => {
    const { id, created_at, updated_at, public_slug, ...rest } = trip;
    const { data, error } = await supabase
      .from("trips")
      .insert({ ...rest, destination: `${rest.destination} (copy)`, status: "draft" })
      .select()
      .single();

    if (error) {
      toast.error("Failed to duplicate trip");
    } else if (data) {
      setTrips((prev) => [data, ...prev]);
      toast.success("Trip duplicated");
    }
  };

  const shareTrip = async (trip: Trip) => {
    if (trip.public_slug) {
      navigator.clipboard.writeText(`${window.location.origin}/trip/${trip.public_slug}`);
      toast.success("Link copied!");
      return;
    }
    const slug = crypto.randomUUID().slice(0, 8);
    const { error } = await supabase.from("trips").update({ public_slug: slug }).eq("id", trip.id);
    if (error) {
      toast.error("Failed to generate link");
    } else {
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? { ...t, public_slug: slug } : t)));
      navigator.clipboard.writeText(`${window.location.origin}/trip/${slug}`);
      toast.success("Public link created and copied!");
    }
  };

  const statusColor = (status: string | null) => {
    if (status === "generated") return "bg-primary/10 text-primary";
    if (status === "generating") return "bg-accent/10 text-accent";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">TripCopilot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild className="gradient-primary border-0">
              <Link to="/create-trip">
                <Plus className="mr-1 h-4 w-4" /> New Trip
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Your Trips</h1>
          <p className="mt-1 text-muted-foreground">
            {trips.length > 0
              ? `You have ${trips.length} trip${trips.length > 1 ? "s" : ""} planned`
              : "No trips yet — create your first adventure!"}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-20 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">No trips yet</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Create your first trip and let AI plan the perfect itinerary for you.
            </p>
            <Button asChild className="mt-6 gradient-primary border-0">
              <Link to="/create-trip">
                <Plus className="mr-1 h-4 w-4" /> Create Trip
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-display text-lg">{trip.destination}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {trip.num_days} day{trip.num_days > 1 ? "s" : ""}
                          {trip.start_date && ` · ${new Date(trip.start_date).toLocaleDateString()}`}
                        </CardDescription>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {trip.interests?.slice(0, 4).map((interest) => (
                        <span key={interest} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        ₹{trip.budget_min?.toLocaleString()}–₹{trip.budget_max?.toLocaleString()}
                      </span>
                      <span className="capitalize">{trip.travel_style}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/trip/${trip.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateTrip(trip)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shareTrip(trip)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteTrip(trip.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
