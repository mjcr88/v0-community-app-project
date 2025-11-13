-- Create check_in_neighborhoods table (for neighborhood-scoped check-ins)
CREATE TABLE IF NOT EXISTS check_in_neighborhoods (
  check_in_id UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  PRIMARY KEY (check_in_id, neighborhood_id)
);

-- Index
CREATE INDEX idx_check_in_neighborhoods_neighborhood_id ON check_in_neighborhoods(neighborhood_id);

-- Comments
COMMENT ON TABLE check_in_neighborhoods IS 'Defines which neighborhoods can see neighborhood-scoped check-ins';
