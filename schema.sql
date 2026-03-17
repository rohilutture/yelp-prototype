-- ============================================================
-- Yelp Prototype - MySQL Schema
-- Run: mysql -u root -p yelp_db < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS yelp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yelp_db;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    hashed_password     VARCHAR(255) NOT NULL,
    role                ENUM('user', 'owner') NOT NULL DEFAULT 'user',
    phone               VARCHAR(30),
    about               TEXT,
    city                VARCHAR(100),
    country             VARCHAR(100),
    gender              VARCHAR(50),
    languages           TEXT,           -- JSON array
    avatar_url          VARCHAR(500),
    restaurant_location VARCHAR(255),   -- owners only
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    cuisine_type    VARCHAR(100),
    address         VARCHAR(300),
    city            VARCHAR(100),
    phone           VARCHAR(30),
    contact_email   VARCHAR(150),
    description     TEXT,
    hours           TEXT,
    price_range     INT DEFAULT 2,      -- 1=$  2=$$  3=$$$  4=$$$$
    amenities       TEXT,               -- JSON array
    photos          TEXT,               -- JSON array of URLs
    avg_rating      FLOAT DEFAULT 0.0,
    review_count    INT DEFAULT 0,
    view_count      INT DEFAULT 0,
    added_by        INT,
    owner_id        INT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_cuisine (cuisine_type),
    INDEX idx_city (city),
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id   INT NOT NULL,
    user_id         INT NOT NULL,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    photos          TEXT,               -- JSON array
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_one_review_per_user (restaurant_id, user_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Favourites
CREATE TABLE IF NOT EXISTS favourites (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    restaurant_id   INT NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_favourite (user_id, restaurant_id),
    FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User preferences (for AI assistant)
CREATE TABLE IF NOT EXISTS user_preferences (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    cuisines    TEXT,       -- JSON array
    price_range TEXT,       -- JSON array
    dietary     TEXT,       -- JSON array
    ambiance    TEXT,       -- JSON array
    sort_by     VARCHAR(50) DEFAULT 'Rating',
    location    VARCHAR(200),
    radius      INT DEFAULT 10,
    updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
