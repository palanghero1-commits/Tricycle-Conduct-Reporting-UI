CREATE TABLE IF NOT EXISTS complaint_category_selections (
  complaint_id CHAR(36) NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id, category_id),
  CONSTRAINT complaint_category_selections_complaint_fk FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  CONSTRAINT complaint_category_selections_category_fk FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
  INDEX complaint_category_selections_category_idx (category_id)
);
INSERT IGNORE INTO complaint_category_selections (complaint_id, category_id)
SELECT id, category_id FROM complaints;
