-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  ingredients_raw TEXT NOT NULL,
  ingredients_parsed JSONB,
  score NUMERIC NOT NULL,
  summary TEXT,
  status TEXT CHECK (status IN ('confirmed', 'needs-review')) DEFAULT 'needs-review',
  front_image TEXT,
  nutrition_image TEXT,
  ingredients_image TEXT,
  analysis JSONB,
  scanned_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Create Ingredients Table
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  score NUMERIC NOT NULL,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 3. Create Facts Table
CREATE TABLE IF NOT EXISTS facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fact TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Leaderboard Table (Aggregated)
CREATE TABLE IF NOT EXISTS leaderboard (
  uid UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  photo_url TEXT,
  count INTEGER DEFAULT 0,
  updated_at BIGINT NOT NULL
);

-- 4.1 Create Users Table (Public Profiles)
CREATE TABLE IF NOT EXISTS users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  photo_url TEXT,
  last_login BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Facts: Anyone can read
CREATE POLICY "Facts are publicly readable" ON facts FOR SELECT USING (true);

-- Ingredients: Anyone can read
CREATE POLICY "Ingredients are publicly readable" ON ingredients FOR SELECT USING (true);

-- Leaderboard: Anyone can read
CREATE POLICY "Leaderboard is publicly readable" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can update their own leaderboard entry" ON leaderboard FOR ALL USING (auth.uid() = uid);

-- Users: Anyone can read, but only owner can update
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR ALL USING (auth.uid() = uid);

-- Products: Authenticated users can read/write their own
CREATE POLICY "Users can read their own products" ON products FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own products" ON products FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = created_by);
