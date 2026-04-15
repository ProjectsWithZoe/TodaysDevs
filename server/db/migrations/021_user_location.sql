-- Store approximate user location (from IP geolocation on first login)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng  DOUBLE PRECISION;
