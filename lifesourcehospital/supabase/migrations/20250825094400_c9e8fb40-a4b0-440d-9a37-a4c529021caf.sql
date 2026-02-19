-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('super_admin', 'hospital_admin', 'hospital_staff', 'donor', 'recipient');

-- Create blood type enum
CREATE TYPE public.blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Create status enums
CREATE TYPE public.hospital_status AS ENUM ('pending', 'verified', 'suspended');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE public.inventory_status AS ENUM ('available', 'used', 'expired', 'discarded');
CREATE TYPE public.request_status AS ENUM ('pending', 'assigned', 'fulfilled', 'partially_fulfilled', 'unavailable', 'cancelled');
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'donor',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  website TEXT,
  services TEXT[],
  status hospital_status DEFAULT 'pending',
  admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hospital_staff table to link staff to hospitals
CREATE TABLE public.hospital_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hospital_id, user_id)
);

-- Create donors table
CREATE TABLE public.donors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  blood_type blood_type NOT NULL,
  date_of_birth DATE NOT NULL,
  weight_kg INTEGER,
  last_donation_date DATE,
  medical_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  is_eligible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipients table
CREATE TABLE public.recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  blood_type blood_type NOT NULL,
  date_of_birth DATE NOT NULL,
  medical_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donation_appointments table
CREATE TABLE public.donation_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  confirmed_by UUID REFERENCES public.profiles(user_id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blood_inventory table
CREATE TABLE public.blood_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  blood_type blood_type NOT NULL,
  quantity_ml INTEGER NOT NULL CHECK (quantity_ml > 0),
  collection_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status inventory_status DEFAULT 'available',
  donor_id UUID REFERENCES public.donors(id),
  batch_number TEXT,
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blood_requests table
CREATE TABLE public.blood_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  blood_type blood_type NOT NULL,
  quantity_ml INTEGER NOT NULL CHECK (quantity_ml > 0),
  urgency urgency_level NOT NULL,
  status request_status DEFAULT 'pending',
  needed_by DATE NOT NULL,
  medical_reason TEXT,
  doctor_name TEXT NOT NULL,
  doctor_contact TEXT NOT NULL,
  assigned_staff_id UUID REFERENCES public.profiles(user_id),
  fulfilled_quantity_ml INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Hospital staff can view relevant profiles" ON public.profiles
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('hospital_admin', 'hospital_staff')
  );

-- RLS Policies for hospitals
CREATE POLICY "Anyone can view verified hospitals" ON public.hospitals
  FOR SELECT USING (status = 'verified');

CREATE POLICY "Super admins can manage all hospitals" ON public.hospitals
  FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Hospital admins can manage their hospital" ON public.hospitals
  FOR ALL USING (admin_user_id = auth.uid());

-- RLS Policies for hospital_staff
CREATE POLICY "Hospital admins can manage their staff" ON public.hospital_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hospitals h 
      WHERE h.id = hospital_id AND h.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view their hospital assignments" ON public.hospital_staff
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for donors
CREATE POLICY "Donors can manage their own data" ON public.donors
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Hospital staff can view donors" ON public.donors
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('hospital_admin', 'hospital_staff', 'super_admin')
  );

-- RLS Policies for recipients
CREATE POLICY "Recipients can manage their own data" ON public.recipients
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Hospital staff can view recipients" ON public.recipients
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('hospital_admin', 'hospital_staff', 'super_admin')
  );

-- RLS Policies for donation_appointments
CREATE POLICY "Donors can view their appointments" ON public.donation_appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.donors d WHERE d.id = donor_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Hospital staff can manage appointments for their hospital" ON public.donation_appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs 
      WHERE hs.hospital_id = donation_appointments.hospital_id 
      AND hs.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.hospitals h 
      WHERE h.id = donation_appointments.hospital_id 
      AND h.admin_user_id = auth.uid()
    )
  );

-- RLS Policies for blood_inventory
CREATE POLICY "Hospital staff can manage their inventory" ON public.blood_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs 
      WHERE hs.hospital_id = blood_inventory.hospital_id 
      AND hs.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.hospitals h 
      WHERE h.id = blood_inventory.hospital_id 
      AND h.admin_user_id = auth.uid()
    )
  );

-- RLS Policies for blood_requests
CREATE POLICY "Recipients can view their requests" ON public.blood_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.recipients r WHERE r.id = recipient_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Recipients can create requests" ON public.blood_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.recipients r WHERE r.id = recipient_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Hospital staff can manage requests for their hospital" ON public.blood_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hospital_staff hs 
      WHERE hs.hospital_id = blood_requests.hospital_id 
      AND hs.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.hospitals h 
      WHERE h.id = blood_requests.hospital_id 
      AND h.admin_user_id = auth.uid()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'donor')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at
  BEFORE UPDATE ON public.recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_appointments_updated_at
  BEFORE UPDATE ON public.donation_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_inventory_updated_at
  BEFORE UPDATE ON public.blood_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();