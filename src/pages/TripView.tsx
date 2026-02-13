import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, Sun, Cloud, CloudRain, MapPin,
  Clock, DollarSign, Lightbulb, AlertTriangle, Download,
  Sunrise, SunMedium, Moon, Bus, Footprints, Car, Plane
} from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Trip = Tables<"trips">;
type ItineraryDay = Tables<"itinerary_days">;
type ItineraryItem = Tables<"itinerary_items">;

const timeSlotIcons: Record<string, any> = {
  morning: Sunrise,
  afternoon: SunMedium,
  evening: Moon,
};

const transportIcons: Record<string, any> = {
  walk: Footprints,
  bus: Bus,
  cab: Car,
  auto: Car,
};

export default function TripView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<(ItineraryDay & { items: ItineraryItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const fetchTrip = useCallback(async () => {
    if (!id) return;

    // Try fetching by ID first, then by slug
    let query = supabase.from("trips").select("*");
    if (id.length === 36) {
      query = query.eq("id", id);
    } else {
      query = query.eq("public_slug", id);
    }

    const { data: tripData } = await query.single();
    if (!tripData) {
      toast.error("Trip not found");
      setLoading(false);
      return;
    }
    setTrip(tripData);

    const { data: daysData } = await supabase
      .from("itinerary_days")
      .select("*")
      .eq("trip_id", tripData.id)
      .order("day_number");

    if (daysData && daysData.length > 0) {
      const { data: items } = await supabase
        .from("itinerary_items")
        .select("*")
        .in("day_id", daysData.map((d) => d.id))
        .order("sort_order");

      const daysWithItems = daysData.map((d) => ({
        ...d,
        items: (items || []).filter((item) => item.day_id === d.id),
      }));
      setDays(daysWithItems);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  useEffect(() => {
    if (searchParams.get("generate") === "true" && trip && days.length === 0 && !generating) {
      generateItinerary();
    }
  }, [trip, days.length, searchParams]);

  const generateItinerary = async () => {
    if (!trip) return;
    setGenerating(true);

    try {
      const response = await supabase.functions.invoke("generate-itinerary", {
        body: {
          tripId: trip.id,
          destination: trip.destination,
          numDays: trip.num_days,
          budgetMin: trip.budget_min,
          budgetMax: trip.budget_max,
          interests: trip.interests,
          travelStyle: trip.travel_style,
          travelPace: trip.travel_pace,
          startDate: trip.start_date,
        },
      });

      if (response.error) throw response.error;

      await supabase.from("trips").update({ status: "generated" }).eq("id", trip.id);
      setTrip((prev) => prev ? { ...prev, status: "generated" } : prev);
      toast.success("Itinerary generated!");
      await fetchTrip();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate itinerary");
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Trip to ${trip?.destination}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`${trip?.num_days} days · ${trip?.travel_style} · ${trip?.travel_pace}`, 14, 30);
    doc.text(`Budget: ₹${trip?.budget_min?.toLocaleString()} – ₹${trip?.budget_max?.toLocaleString()}`, 14, 37);

    let y = 45;
    days.forEach((day) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text(`Day ${day.day_number}${day.summary ? ` – ${day.summary}` : ""}`, 14, y);
      y += 8;

      const rows = day.items.filter(i => !i.is_backup).map((item) => [
        item.time_slot,
        item.place_name,
        item.start_time || "",
        `${item.duration_minutes || 60} min`,
        `₹${item.estimated_cost || 0}`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Slot", "Place", "Time", "Duration", "Cost"]],
        body: rows,
        margin: { left: 14 },
        theme: "grid",
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`trip-${trip?.destination?.replace(/\s/g, "-")}.pdf`);
    toast.success("PDF downloaded!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="font-display text-2xl font-bold">Trip not found</h1>
        <Button asChild variant="outline"><Link to="/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  const isOwner = user?.id === trip.user_id;
  const budgetBreakdown = trip.budget_breakdown as Record<string, number> | null;
  const localTips = trip.local_tips as { tips?: string[]; scams?: string[] } | null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to={isOwner ? "/dashboard" : "/"} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-display font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && days.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
            )}
            {isOwner && (
              <Button size="sm" className="gradient-primary border-0" onClick={generateItinerary} disabled={generating}>
                <Sparkles className="mr-1 h-4 w-4" />
                {generating ? "Generating..." : days.length > 0 ? "Regenerate" : "Generate"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Trip header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{trip.destination}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{trip.num_days} days</span>
            <span>·</span>
            <span className="capitalize">{trip.travel_style}</span>
            <span>·</span>
            <span className="capitalize">{trip.travel_pace}</span>
            <span>·</span>
            <span>₹{trip.budget_min?.toLocaleString()} – ₹{trip.budget_max?.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {trip.interests?.map((interest) => (
              <span key={interest} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {interest}
              </span>
            ))}
          </div>
        </motion.div>

        {generating && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="font-display text-xl font-semibold">Generating your itinerary...</h2>
            <p className="mt-2 text-muted-foreground">AI is crafting the perfect trip. This may take a moment.</p>
          </div>
        )}

        {!generating && days.length === 0 && isOwner && (
          <div className="flex flex-col items-center py-20 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-primary" />
            <h2 className="font-display text-xl font-semibold">Ready to generate?</h2>
            <p className="mt-2 text-muted-foreground">Click "Generate" to create your AI-powered itinerary.</p>
          </div>
        )}

        {days.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Itinerary */}
            <div className="space-y-4">
              {/* Day tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDay(i)}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all
                      ${activeDay === i ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  >
                    Day {d.day_number}
                  </button>
                ))}
              </div>

              {/* Active day content */}
              {days[activeDay] && (
                <motion.div key={days[activeDay].id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {days[activeDay].summary && (
                    <p className="mb-4 text-muted-foreground">{days[activeDay].summary}</p>
                  )}

                  {["morning", "afternoon", "evening"].map((slot) => {
                    const items = days[activeDay].items.filter((i) => i.time_slot === slot && !i.is_backup);
                    if (items.length === 0) return null;
                    const SlotIcon = timeSlotIcons[slot] || Sun;

                    return (
                      <div key={slot} className="mb-6">
                        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold capitalize">
                          <SlotIcon className="h-5 w-5 text-primary" /> {slot}
                        </h3>
                        <div className="space-y-3">
                          {items.map((item) => {
                            const TransportIcon = item.transport_mode ? transportIcons[item.transport_mode] || Bus : null;
                            return (
                              <Card key={item.id} className="border-border/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-display font-semibold">{item.place_name}</h4>
                                      {item.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                      )}
                                    </div>
                                    {item.estimated_cost != null && item.estimated_cost > 0 && (
                                      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                                        ₹{item.estimated_cost}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    {item.start_time && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> {item.start_time}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" /> {item.duration_minutes || 60} min
                                    </span>
                                  </div>
                                  {item.tips && (
                                    <p className="mt-2 flex items-start gap-1 rounded-lg bg-primary/5 p-2 text-xs text-primary">
                                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                      {item.tips}
                                    </p>
                                  )}
                                  {TransportIcon && item.transport_duration_minutes && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                      <TransportIcon className="h-3.5 w-3.5" />
                                      <span className="capitalize">{item.transport_mode}</span> · {item.transport_duration_minutes} min
                                      {item.transport_cost != null && item.transport_cost > 0 && ` · ₹${item.transport_cost}`}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Backup activities */}
                  {days[activeDay].items.filter((i) => i.is_backup).length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-muted-foreground">
                        <CloudRain className="h-5 w-5" /> Backup / Rainy Day
                      </h3>
                      <div className="space-y-2">
                        {days[activeDay].items.filter((i) => i.is_backup).map((item) => (
                          <Card key={item.id} className="border-dashed border-border/50">
                            <CardContent className="p-4">
                              <h4 className="font-medium">{item.place_name}</h4>
                              {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {budgetBreakdown && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-display text-base">
                      <DollarSign className="h-4 w-4 text-primary" /> Budget Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(budgetBreakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{key}</span>
                        <span className="font-semibold">₹{Number(value).toLocaleString()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {localTips?.tips && localTips.tips.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-display text-base">
                      <Lightbulb className="h-4 w-4 text-primary" /> Local Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {localTips.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {localTips?.scams && localTips.scams.length > 0 && (
                <Card className="border-destructive/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-display text-base text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Common Scams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {localTips.scams.map((scam, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                          {scam}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
