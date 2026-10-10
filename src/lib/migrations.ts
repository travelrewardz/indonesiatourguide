/**
 * SQL schema migrations, applied in order and tracked with PRAGMA user_version.
 * The database is a real relational SQLite database (ACID, transactions, indexes).
 */
export const MIGRATIONS: string[] = [
  // ---------------------------------------------------------------- v1 core
  `
  CREATE TABLE users (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    phone             TEXT,
    country           TEXT,
    password_hash     TEXT NOT NULL,
    auth_provider     TEXT NOT NULL DEFAULT 'credentials',
    provider_id       TEXT,
    role              TEXT NOT NULL DEFAULT 'CUSTOMER',
    status            TEXT NOT NULL DEFAULT 'ACTIVE',
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );
  CREATE INDEX idx_users_role ON users(role);

  CREATE TABLE suppliers (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name       TEXT NOT NULL,
    contact_person     TEXT NOT NULL,
    email              TEXT NOT NULL,
    phone              TEXT,
    address            TEXT,
    destinations       TEXT NOT NULL DEFAULT '[]',
    license_number     TEXT,
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    bank_info          TEXT,
    commission_pct     REAL NOT NULL DEFAULT 15,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
  );

  CREATE TABLE agents (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company        TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email          TEXT NOT NULL,
    phone          TEXT,
    country        TEXT,
    website        TEXT,
    status         TEXT NOT NULL DEFAULT 'PENDING',
    commission_pct REAL NOT NULL DEFAULT 15,
    net_rate_access INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE TABLE destinations (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    slug           TEXT NOT NULL UNIQUE,
    region         TEXT,
    tagline        TEXT,
    description    TEXT,
    hero_image     TEXT,
    gallery        TEXT NOT NULL DEFAULT '[]',
    seo_title      TEXT,
    seo_description TEXT,
    seo_keywords   TEXT,
    featured       INTEGER NOT NULL DEFAULT 0,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );
  CREATE INDEX idx_destinations_featured ON destinations(featured, sort_order);

  CREATE TABLE tours (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    slug              TEXT NOT NULL UNIQUE,
    short_description TEXT,
    full_description  TEXT,
    destination_id    TEXT REFERENCES destinations(id) ON DELETE SET NULL,
    region            TEXT,
    duration_days     INTEGER NOT NULL DEFAULT 1,
    duration_text     TEXT,
    category          TEXT,
    difficulty        TEXT,
    min_pax           INTEGER NOT NULL DEFAULT 1,
    max_pax           INTEGER NOT NULL DEFAULT 12,
    base_price        REAL NOT NULL DEFAULT 0,
    sale_price        REAL,
    currency          TEXT NOT NULL DEFAULT 'USD',
    agent_price       REAL,
    supplier_id       TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    rating            REAL NOT NULL DEFAULT 0,
    review_count      INTEGER NOT NULL DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'DRAFT',
    featured          INTEGER NOT NULL DEFAULT 0,
    highlights        TEXT NOT NULL DEFAULT '[]',
    includes          TEXT NOT NULL DEFAULT '[]',
    excludes          TEXT NOT NULL DEFAULT '[]',
    pickup_info       TEXT,
    faqs              TEXT NOT NULL DEFAULT '[]',
    map_lat           REAL,
    map_lng           REAL,
    seo_title         TEXT,
    seo_description   TEXT,
    seo_keywords      TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );
  CREATE INDEX idx_tours_status ON tours(status, featured);
  CREATE INDEX idx_tours_destination ON tours(destination_id);
  CREATE INDEX idx_tours_supplier ON tours(supplier_id);
  CREATE INDEX idx_tours_category ON tours(category);

  CREATE TABLE tour_images (
    id         TEXT PRIMARY KEY,
    tour_id    TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    alt_text   TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_tour_images_tour ON tour_images(tour_id, sort_order);

  CREATE TABLE tour_itinerary (
    id          TEXT PRIMARY KEY,
    tour_id     TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    day         INTEGER NOT NULL DEFAULT 1,
    time        TEXT,
    title       TEXT NOT NULL,
    description TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_tour_itinerary_tour ON tour_itinerary(tour_id, sort_order);

  CREATE TABLE tour_options (
    id            TEXT PRIMARY KEY,
    tour_id       TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    price         REAL NOT NULL,
    min_pax       INTEGER NOT NULL DEFAULT 1,
    max_pax       INTEGER NOT NULL DEFAULT 12,
    duration_text TEXT,
    inclusions    TEXT NOT NULL DEFAULT '[]',
    exclusions    TEXT NOT NULL DEFAULT '[]',
    is_available  INTEGER NOT NULL DEFAULT 1,
    sort_order    INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_tour_options_tour ON tour_options(tour_id, sort_order);

  CREATE TABLE availability (
    id              TEXT PRIMARY KEY,
    tour_id         TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    option_id       TEXT NOT NULL DEFAULT '',
    date            TEXT NOT NULL,
    available_slots INTEGER NOT NULL DEFAULT 0,
    booked_slots    INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'AVAILABLE',
    updated_at      TEXT NOT NULL
  );
  CREATE UNIQUE INDEX idx_availability_unique ON availability(tour_id, option_id, date);
  CREATE INDEX idx_availability_date ON availability(tour_id, date);

  CREATE TABLE price_rules (
    id        TEXT PRIMARY KEY,
    tour_id   TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL DEFAULT '',
    date_from TEXT NOT NULL,
    date_to   TEXT NOT NULL,
    price     REAL NOT NULL,
    label     TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_price_rules_tour ON price_rules(tour_id, date_from, date_to);

  CREATE TABLE bookings (
    id                 TEXT PRIMARY KEY,
    booking_number     TEXT NOT NULL UNIQUE,
    customer_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
    tour_id            TEXT NOT NULL REFERENCES tours(id),
    option_id          TEXT,
    travel_date        TEXT NOT NULL,
    pax                INTEGER NOT NULL DEFAULT 1,
    adults             INTEGER NOT NULL DEFAULT 1,
    children           INTEGER NOT NULL DEFAULT 0,
    pickup_location    TEXT,
    hotel              TEXT,
    special_request    TEXT,
    total_price        REAL NOT NULL,
    currency           TEXT NOT NULL DEFAULT 'USD',
    commission         REAL NOT NULL DEFAULT 0,
    supplier_amount    REAL NOT NULL DEFAULT 0,
    agent_id           TEXT,
    agent_net_total    REAL,
    customer_name      TEXT NOT NULL,
    customer_email     TEXT NOT NULL,
    customer_phone     TEXT,
    payment_status     TEXT NOT NULL DEFAULT 'PENDING',
    booking_status     TEXT NOT NULL DEFAULT 'PENDING',
    confirmation_status TEXT NOT NULL DEFAULT 'UNCONFIRMED',
    source             TEXT NOT NULL DEFAULT 'website',
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
  );
  CREATE INDEX idx_bookings_customer ON bookings(customer_id, created_at);
  CREATE INDEX idx_bookings_tour ON bookings(tour_id, travel_date);
  CREATE INDEX idx_bookings_status ON bookings(booking_status, payment_status);
  CREATE INDEX idx_bookings_agent ON bookings(agent_id);
  CREATE INDEX idx_bookings_created ON bookings(created_at);

  CREATE TABLE payments (
    id            TEXT PRIMARY KEY,
    booking_id    TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider      TEXT NOT NULL,
    amount        REAL NOT NULL,
    currency      TEXT NOT NULL DEFAULT 'USD',
    status        TEXT NOT NULL DEFAULT 'PENDING',
    transaction_id TEXT,
    payment_date  TEXT,
    payload       TEXT NOT NULL DEFAULT '{}',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );
  CREATE INDEX idx_payments_booking ON payments(booking_id);

  CREATE TABLE reviews (
    id          TEXT PRIMARY KEY,
    booking_id  TEXT,
    customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    tour_id     TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating      INTEGER NOT NULL,
    review      TEXT,
    photos      TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'PENDING',
    created_at  TEXT NOT NULL
  );
  CREATE INDEX idx_reviews_tour ON reviews(tour_id, status);

  CREATE TABLE enquiries (
    id            TEXT PRIMARY KEY,
    type          TEXT NOT NULL DEFAULT 'contact',
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT,
    country       TEXT,
    tour_slug     TEXT,
    destination   TEXT,
    travel_date   TEXT,
    pax           INTEGER,
    budget        TEXT,
    interests     TEXT,
    accommodation TEXT,
    message       TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'NEW',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );
  CREATE INDEX idx_enquiries_status ON enquiries(status, created_at);

  CREATE TABLE quotes (
    id           TEXT PRIMARY KEY,
    reference    TEXT NOT NULL UNIQUE,
    agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tour_id      TEXT NOT NULL REFERENCES tours(id),
    option_id    TEXT,
    customer_name TEXT,
    travel_date  TEXT NOT NULL,
    pax          INTEGER NOT NULL DEFAULT 1,
    net_total    REAL NOT NULL,
    gross_total  REAL NOT NULL,
    status       TEXT NOT NULL DEFAULT 'DRAFT',
    notes        TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );
  CREATE INDEX idx_quotes_agent ON quotes(agent_id, status);

  CREATE TABLE notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT,
    link       TEXT,
    read_at    TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);

  CREATE TABLE email_outbox (
    id         TEXT PRIMARY KEY,
    to_email   TEXT NOT NULL,
    to_name    TEXT,
    subject    TEXT NOT NULL,
    html       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'QUEUED',
    error      TEXT,
    sent_at    TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE cms_pages (
    id         TEXT PRIMARY KEY,
    slug       TEXT NOT NULL UNIQUE,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL DEFAULT '',
    seo_title  TEXT,
    seo_description TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE blog_posts (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    author      TEXT,
    cover_image TEXT,
    content     TEXT NOT NULL,
    excerpt     TEXT,
    destination_id TEXT REFERENCES destinations(id) ON DELETE SET NULL,
    category    TEXT,
    seo_title   TEXT,
    seo_description TEXT,
    status      TEXT NOT NULL DEFAULT 'DRAFT',
    published_at TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX idx_blog_status ON blog_posts(status, published_at);

  CREATE TABLE fx_rates (
    currency    TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    symbol      TEXT NOT NULL,
    rate_to_usd REAL NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `,

  // --------------------------------------------- v2 multi-attribute + pricing
  // Supplier preferred currency, multi destination/region/category on tours,
  // optional agent discount percentage, option descriptions and pax-tier pricing.
  `
  ALTER TABLE suppliers ADD COLUMN preferred_currency TEXT NOT NULL DEFAULT 'USD';

  ALTER TABLE tours ADD COLUMN destinations TEXT NOT NULL DEFAULT '[]'; -- JSON array of destination slugs
  ALTER TABLE tours ADD COLUMN regions       TEXT NOT NULL DEFAULT '[]'; -- JSON array of region names
  ALTER TABLE tours ADD COLUMN categories    TEXT NOT NULL DEFAULT '[]'; -- JSON array of category names
  ALTER TABLE tours ADD COLUMN agent_discount_pct REAL;                  -- NULL = no agent/member discount

  ALTER TABLE tour_options ADD COLUMN description TEXT;

  -- Backfill the arrays from the legacy single-value columns (pre-seed rows;
  -- the seeder writes the arrays itself for fresh databases).
  UPDATE tours SET destinations = COALESCE(
           (SELECT json_group_array(slug) FROM destinations WHERE id = tours.destination_id), '[]')
   WHERE destination_id IS NOT NULL;
  UPDATE tours SET regions   = json_array(region) WHERE region   IS NOT NULL AND region   <> '';
  UPDATE tours SET categories = json_array(category) WHERE category IS NOT NULL AND category <> '';

  -- Group-size (pax) pricing tiers. option_id = '' means the tour-level tier
  -- ladder (used for the card "from" price); otherwise it belongs to an option.
  CREATE TABLE tour_price_tiers (
    id         TEXT PRIMARY KEY,
    tour_id    TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    option_id  TEXT NOT NULL DEFAULT '',
    label      TEXT,
    min_pax    INTEGER NOT NULL DEFAULT 1,
    max_pax    INTEGER,               -- NULL = no upper limit
    price      REAL NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_price_tiers_tour ON tour_price_tiers(tour_id, option_id, min_pax);
  `,
];
