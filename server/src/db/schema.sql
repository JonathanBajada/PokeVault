-- Create cards table
CREATE TABLE cards (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	set_name VARCHAR(255),
	rarity VARCHAR(100),
	image_small_url TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cards_name ON cards(name);

-- Create index on set_name
CREATE INDEX idx_cards_set_name ON cards(set_name);

-- Create index on rarity
CREATE INDEX idx_cards_rarity ON cards(rarity);

