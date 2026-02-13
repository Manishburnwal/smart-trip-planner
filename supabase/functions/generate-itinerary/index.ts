import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tripId, destination, numDays, budgetMin, budgetMax, interests, travelStyle, travelPace, startDate } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const prompt = `You are a travel planning AI. Create a detailed ${numDays}-day itinerary for ${destination}.

Travel details:
- Budget: ₹${budgetMin} to ₹${budgetMax} (INR)
- Interests: ${(interests || []).join(", ")}
- Travel style: ${travelStyle}
- Travel pace: ${travelPace}
- Start date: ${startDate || "flexible"}

Return a JSON object with this EXACT structure (no markdown, just pure JSON):
{
  "days": [
    {
      "day_number": 1,
      "summary": "Brief summary of the day",
      "activities": [
        {
          "place_name": "Place Name",
          "description": "What to do here",
          "time_slot": "morning|afternoon|evening",
          "start_time": "09:00 AM",
          "duration_minutes": 90,
          "estimated_cost": 500,
          "coordinates": { "lat": 15.4909, "lng": 73.8278 },
          "tips": "Local tip for this place",
          "is_backup": false,
          "transport_mode": "walk|bus|cab|auto",
          "transport_duration_minutes": 15,
          "transport_cost": 100,
          "sort_order": 1
        }
      ]
    }
  ],
  "budget_breakdown": {
    "accommodation": 5000,
    "food": 3000,
    "transport": 2000,
    "activities": 3000,
    "miscellaneous": 1000
  },
  "local_tips": {
    "tips": ["Tip 1", "Tip 2", "Tip 3"],
    "scams": ["Common scam 1", "Common scam 2"]
  }
}

Rules:
- Include 3-5 activities per day for ${travelPace} pace
- For each day include 1-2 backup/rainy day activities (is_backup: true)
- Include realistic coordinates for the places
- Budget breakdown should fit within ₹${budgetMin}-₹${budgetMax}
- Include transport suggestions between consecutive activities
- Add local tips specific to ${destination}
- All costs in INR`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a travel planning expert. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let itinerary;
    try {
      itinerary = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Delete existing itinerary data for this trip
    const { data: existingDays } = await supabaseAdmin
      .from("itinerary_days")
      .select("id")
      .eq("trip_id", tripId);

    if (existingDays && existingDays.length > 0) {
      await supabaseAdmin
        .from("itinerary_items")
        .delete()
        .in("day_id", existingDays.map((d: any) => d.id));
      await supabaseAdmin
        .from("itinerary_days")
        .delete()
        .eq("trip_id", tripId);
    }

    // Insert new days and items
    for (const day of itinerary.days) {
      const { data: dayRow, error: dayError } = await supabaseAdmin
        .from("itinerary_days")
        .insert({
          trip_id: tripId,
          day_number: day.day_number,
          summary: day.summary,
        })
        .select()
        .single();

      if (dayError) {
        console.error("Day insert error:", dayError);
        continue;
      }

      if (day.activities && day.activities.length > 0) {
        const items = day.activities.map((a: any, idx: number) => ({
          day_id: dayRow.id,
          place_name: a.place_name,
          description: a.description,
          time_slot: a.time_slot || "morning",
          start_time: a.start_time,
          duration_minutes: a.duration_minutes || 60,
          estimated_cost: a.estimated_cost || 0,
          coordinates: a.coordinates || null,
          tips: a.tips,
          is_backup: a.is_backup || false,
          transport_mode: a.transport_mode,
          transport_duration_minutes: a.transport_duration_minutes,
          transport_cost: a.transport_cost || 0,
          sort_order: a.sort_order || idx,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from("itinerary_items")
          .insert(items);

        if (itemsError) console.error("Items insert error:", itemsError);
      }
    }

    // Update trip with budget breakdown and local tips
    await supabaseAdmin.from("trips").update({
      budget_breakdown: itinerary.budget_breakdown || null,
      local_tips: itinerary.local_tips || null,
      status: "generated",
    }).eq("id", tripId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-itinerary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
