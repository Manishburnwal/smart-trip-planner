
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  travel_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  num_days INTEGER NOT NULL DEFAULT 3,
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 10000,
  currency TEXT DEFAULT 'INR',
  interests TEXT[] DEFAULT '{}',
  travel_style TEXT DEFAULT 'solo',
  travel_pace TEXT DEFAULT 'relaxed',
  status TEXT DEFAULT 'draft',
  public_slug TEXT UNIQUE,
  local_tips JSONB,
  budget_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public trips viewable by slug" ON public.trips FOR SELECT USING (public_slug IS NOT NULL);

-- Itinerary days table
CREATE TABLE public.itinerary_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  weather_data JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own itinerary days" ON public.itinerary_days FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_days.trip_id AND (trips.user_id = auth.uid() OR trips.public_slug IS NOT NULL)));
CREATE POLICY "Users can insert own itinerary days" ON public.itinerary_days FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_days.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users can update own itinerary days" ON public.itinerary_days FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_days.trip_id AND trips.user_id = auth.uid()));
CREATE POLICY "Users can delete own itinerary days" ON public.itinerary_days FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_days.trip_id AND trips.user_id = auth.uid()));

-- Itinerary items table
CREATE TABLE public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  place_name TEXT NOT NULL,
  description TEXT,
  time_slot TEXT NOT NULL DEFAULT 'morning',
  start_time TEXT,
  duration_minutes INTEGER DEFAULT 60,
  estimated_cost NUMERIC DEFAULT 0,
  coordinates JSONB,
  tips TEXT,
  is_backup BOOLEAN DEFAULT false,
  transport_mode TEXT,
  transport_duration_minutes INTEGER,
  transport_cost NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own itinerary items" ON public.itinerary_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = itinerary_items.day_id AND (t.user_id = auth.uid() OR t.public_slug IS NOT NULL)
  ));
CREATE POLICY "Users can insert own itinerary items" ON public.itinerary_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = itinerary_items.day_id AND t.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own itinerary items" ON public.itinerary_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = itinerary_items.day_id AND t.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own itinerary items" ON public.itinerary_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.itinerary_days d
    JOIN public.trips t ON t.id = d.trip_id
    WHERE d.id = itinerary_items.day_id AND t.user_id = auth.uid()
  ));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
