-- Capture browser/device from User-Agent and city/country from IP geolocation
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ua_browser   TEXT,
  ADD COLUMN IF NOT EXISTS ua_device    TEXT,
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS country_code CHAR(2);
