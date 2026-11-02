CREATE TABLE IF NOT EXISTS complaint_category_selections (
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES complaint_categories(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id, category_id)
);
CREATE INDEX IF NOT EXISTS complaint_category_selections_category_idx ON complaint_category_selections(category_id);
INSERT INTO complaint_category_selections (complaint_id, category_id)
SELECT id, category_id FROM complaints
ON CONFLICT (complaint_id, category_id) DO NOTHING;
