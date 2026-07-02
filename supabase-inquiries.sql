-- Create the inquiries table
CREATE TABLE public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert an inquiry (publicly accessible contact form)
CREATE POLICY "Allow public inserts on inquiries" 
ON public.inquiries FOR INSERT TO public 
WITH CHECK (true);

-- Allow authenticated users to select (we will restrict to superadmin via the API route)
CREATE POLICY "Allow authenticated read" 
ON public.inquiries FOR SELECT TO authenticated 
USING (true);
