ALTER TABLE submissions
ADD COLUMN category TEXT NOT NULL DEFAULT 'educational'
CHECK (category IN ('educational', 'network-building', 'collaborative'));
