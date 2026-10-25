/**
 * The curriculum's starter databases.
 *
 * Each entry becomes one virtual SQLite database (`shop_db`, `sales_db`, …) that
 * the sandbox provisions on first use through `sqlEngine.useDataset()`. Lessons
 * never share a database with each other, so a learner who deletes every row in a
 * Module 4 exercise cannot break the Module 8 joins they open next — and the
 * playground's own `college_db` stays the learner's to keep.
 *
 * Data is deliberately small (a handful of rows per table) so a printed result
 * table can be checked by eye, and every row here is real data the harness runs
 * against: `curriculum/verify.test.ts` executes the `expected` grid of every
 * example in the book, so a wrong number in this file fails the test suite.
 */

import { PLAYGROUND_SEED } from "../exercises";
import type { Dataset, DatasetId } from "./types";

/** Parents before children: this engine enforces foreign keys like MySQL does. */
export const DATASETS: Record<DatasetId, Dataset> = {
  /* Throwaway workspace for DDL/DML practice: nothing else reads it. */
  practice: {
    id: "practice",
    database: "practice_db",
    title: "Practice workspace",
    blurb: "An empty-ish sandbox for creating, changing and dropping your own tables.",
    tables: [{ name: "scratchpad", purpose: "three throwaway rows to experiment on" }],
    seed: `
CREATE TABLE scratchpad (
  id INTEGER PRIMARY KEY,
  label TEXT,
  value INTEGER
);
INSERT INTO scratchpad (id, label, value) VALUES
  (1, 'alpha', 10),
  (2, 'beta', 20),
  (3, 'gamma', 30);
`,
  },

  /* The learner's playground: same script the Live Lab seeds, so both agree. */
  college: {
    id: "college",
    database: "college_db",
    title: "College database",
    blurb: "Students, courses and enrollments — the tutorial classic.",
    tables: [
      { name: "students", purpose: "one row per student, with their course name and marks" },
      { name: "courses", purpose: "one row per course, with credits" },
      { name: "enrollments", purpose: "one row per student × course, with a grade" },
      { name: "student", purpose: "syllabus student table (rollno, name, marks, grade, city)" },
      { name: "course", purpose: "syllabus course table (student_id, course)" },
      { name: "employee", purpose: "syllabus employee table for self joins (id, name, manager_id)" },
    ],
    seed: PLAYGROUND_SEED,
  },

  shop: {
    id: "shop",
    database: "shop_db",
    title: "Bookstore shop",
    blurb: "Customers, products, orders and the line items inside each order.",
    tables: [
      { name: "customers", purpose: "who bought, where they live, when they joined" },
      { name: "products", purpose: "catalogue with price and stock" },
      { name: "orders", purpose: "one order per customer, with a status" },
      { name: "order_items", purpose: "the lines inside an order (many per order)" },
    ],
    seed: `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  joined_on TEXT
);
INSERT INTO customers (id, name, city, joined_on) VALUES
  (1, 'Asha Rao', 'Bengaluru', '2023-01-14'),
  (2, 'Dev Malhotra', 'Pune', '2023-03-02'),
  (3, 'Iqbal Sheikh', 'Delhi', '2023-06-21'),
  (4, 'Sara Fernandes', 'Goa', '2024-02-09'),
  (5, 'Tanvi Shah', 'Pune', '2024-05-17');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);
INSERT INTO products (id, title, category, price, stock) VALUES
  (1, 'Keyboard', 'electronics', 1499.00, 12),
  (2, 'Mouse', 'electronics', 699.00, 30),
  (3, 'Desk Lamp', 'home', 899.50, 7),
  (4, 'Notebook', 'stationery', 149.00, 100),
  (5, 'Standing Desk', 'furniture', 12999.00, 3),
  (6, 'Webcam', 'electronics', 2499.00, 0);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);
INSERT INTO orders (id, customer_id, ordered_on, status) VALUES
  (1, 1, '2024-04-01', 'shipped'),
  (2, 1, '2024-04-18', 'paid'),
  (3, 2, '2024-04-18', 'shipped'),
  (4, 3, '2024-05-02', 'cancelled'),
  (5, 1, '2024-05-21', 'new'),
  (6, 4, '2024-06-03', 'shipped');

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 1, 1499.00),
  (2, 1, 2, 2, 699.00),
  (3, 2, 3, 1, 899.50),
  (4, 3, 1, 1, 1499.00),
  (5, 3, 5, 1, 12999.00),
  (6, 4, 4, 3, 149.00),
  (7, 5, 2, 1, 699.00),
  (8, 6, 6, 1, 2499.00);
`,
  },

  sales: {
    id: "sales",
    database: "sales_db",
    title: "Sales analytics",
    blurb: "Regions, salespeople and closed deals — the numbers a manager asks about.",
    tables: [
      { name: "regions", purpose: "four territories across two countries" },
      { name: "salespersons", purpose: "who sells, where, since when, at what salary" },
      { name: "deals", purpose: "one row per closed deal with amount and channel" },
    ],
    seed: `
CREATE TABLE regions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);
INSERT INTO regions (id, name, country) VALUES
  (1, 'North', 'India'),
  (2, 'South', 'India'),
  (3, 'Midwest', 'India'),
  (4, 'Gulf', 'UAE');

CREATE TABLE salespersons (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  region_id INTEGER NOT NULL REFERENCES regions(id),
  hired_on TEXT NOT NULL,
  salary DECIMAL(10,2) NOT NULL
);
INSERT INTO salespersons (id, name, region_id, hired_on, salary) VALUES
  (1, 'Kavya', 2, '2021-03-15', 72000.00),
  (2, 'Arjun', 1, '2020-07-01', 68000.00),
  (3, 'Nadia', 4, '2022-01-10', 81000.00),
  (4, 'Ravi', 3, '2021-11-22', 55000.00),
  (5, 'Leela', 2, '2023-02-14', 61000.00);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY,
  salesperson_id INTEGER NOT NULL REFERENCES salespersons(id),
  closed_on TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  channel TEXT NOT NULL
);
INSERT INTO deals (id, salesperson_id, closed_on, amount, channel) VALUES
  (1, 1, '2024-01-08', 12000.00, 'online'),
  (2, 1, '2024-01-22', 7500.00, 'direct'),
  (3, 2, '2024-02-03', 9800.00, 'partner'),
  (4, 2, '2024-02-27', 15400.00, 'online'),
  (5, 3, '2024-03-05', 22000.00, 'direct'),
  (6, 1, '2024-03-19', 4300.00, 'partner'),
  (7, 4, '2024-04-02', 6100.00, 'online'),
  (8, 3, '2024-04-18', 11000.00, 'online'),
  (9, 5, '2024-05-06', 8700.00, 'direct'),
  (10, 2, '2024-05-21', 13200.00, 'partner'),
  (11, 4, '2024-06-04', 5400.00, 'direct'),
  (12, 5, '2024-06-17', 16800.00, 'online');
`,
  },

  blog: {
    id: "blog",
    database: "blog_db",
    title: "Tech blog",
    blurb: "Posts, comments and tags — including a true many-to-many junction.",
    tables: [
      { name: "authors", purpose: "who writes" },
      { name: "posts", purpose: "one row per article, with views and a publish date" },
      { name: "comments", purpose: "reader comments on a post" },
      { name: "tags", purpose: "the vocabulary of topics" },
      { name: "post_tags", purpose: "junction table: which post has which tag (many-to-many)" },
    ],
    seed: `
CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  joined_on TEXT
);
INSERT INTO authors (id, name, country, joined_on) VALUES
  (1, 'Meera Iyer', 'India', '2022-05-01'),
  (2, 'Tom Weber', 'Germany', '2022-09-12'),
  (3, 'Ada Okoye', 'Nigeria', '2023-01-30'),
  (4, 'Rin Sato', 'Japan', '2023-08-08');

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES authors(id),
  title TEXT NOT NULL,
  published_on TEXT,
  views INTEGER NOT NULL DEFAULT 0
);
INSERT INTO posts (id, author_id, title, published_on, views) VALUES
  (1, 1, 'Why PRIMARY KEY matters', '2023-02-11', 4200),
  (2, 1, 'JOINs without fear', '2023-06-02', 8100),
  (3, 2, 'Index internals', '2023-09-19', 1500),
  (4, 3, 'Window functions by example', '2024-01-07', 6400),
  (5, 3, 'NULL, the polite lie', '2024-03-23', 900),
  (6, 4, 'Backups you can trust', NULL, 0);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  author_id INTEGER REFERENCES authors(id),
  body TEXT NOT NULL,
  posted_on TEXT
);
INSERT INTO comments (id, post_id, author_id, body, posted_on) VALUES
  (1, 1, 2, 'Which key did you pick?', '2023-02-12'),
  (2, 1, 3, 'Saved me an hour.', '2023-03-04'),
  (3, 2, 4, 'LEFT JOIN finally clicked.', '2023-06-05'),
  (4, 2, 1, 'Try a self join next!', '2023-06-20'),
  (5, 3, NULL, 'How deep is the B-tree?', '2023-10-01'),
  (6, 4, 1, 'ROW_NUMBER vs RANK, please', '2024-01-09'),
  (7, 4, 2, 'Frames explained at last.', '2024-02-14');

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO tags (id, name) VALUES
  (1, 'sql'),
  (2, 'design'),
  (3, 'performance'),
  (4, 'analytics'),
  (5, 'ops');

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id),
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);
INSERT INTO post_tags (post_id, tag_id) VALUES
  (1, 1), (1, 2),
  (2, 1), (2, 4),
  (3, 1), (3, 3),
  (4, 1), (4, 4),
  (5, 1),
  (6, 5);
`,
  },

  library: {
    id: "library",
    database: "library_db",
    title: "City library",
    blurb: "Books, members and loans — with NULLs and dates to reason about.",
    tables: [
      { name: "books", purpose: "the catalogue, with copies owned" },
      { name: "members", purpose: "who can borrow" },
      { name: "loans", purpose: "one row per borrow; returned_on is NULL while it is out" },
    ],
    seed: `
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  published_year INTEGER,
  copies INTEGER NOT NULL DEFAULT 1
);
INSERT INTO books (id, title, author, genre, published_year, copies) VALUES
  (1, 'The Pragmatic SQL', 'D. Thomas', 'technical', 2019, 4),
  (2, 'Plain Statistics', 'A. Ghangurde', 'science', 2015, 2),
  (3, 'Midnight Library', 'N. Keyes', 'fiction', 2020, 1),
  (4, 'Database Internals', 'A. Petrov', 'technical', 2022, 3),
  (5, 'Old Almanac', 'Anon.', NULL, NULL, 1);

CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  joined_on TEXT
);
INSERT INTO members (id, name, city, joined_on) VALUES
  (1, 'Farhan Qureshi', 'Pune', '2021-04-18'),
  (2, 'Lakshmi Menon', 'Kochi', '2022-08-30'),
  (3, 'Joseph Mistry', 'Pune', '2023-02-11'),
  (4, 'Ananya Bose', 'Kolkata', '2024-01-05');

CREATE TABLE loans (
  id INTEGER PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  borrowed_on TEXT NOT NULL,
  due_on TEXT NOT NULL,
  returned_on TEXT
);
INSERT INTO loans (id, book_id, member_id, borrowed_on, due_on, returned_on) VALUES
  (1, 1, 1, '2024-01-10', '2024-01-24', '2024-01-20'),
  (2, 3, 2, '2024-02-01', '2024-02-15', '2024-02-27'),
  (3, 1, 3, '2024-03-04', '2024-03-18', NULL),
  (4, 4, 1, '2024-05-09', '2024-05-23', '2024-05-21'),
  (5, 2, 4, '2024-06-01', '2024-06-15', NULL),
  (6, 5, 2, '2024-06-20', '2024-07-04', '2024-07-02');
`,
  },

  bank: {
    id: "bank",
    database: "bank_db",
    title: "Bank ledger",
    blurb: "Accounts and transactions, guarded by CHECK constraints and transactions.",
    tables: [
      { name: "accounts", purpose: "balance never goes below zero (CHECK)" },
      { name: "transactions", purpose: "credit and debit movements per account" },
    ],
    seed: `
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  holder TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'current')),
  balance DECIMAL(12,2) NOT NULL CHECK (balance >= 0),
  opened_on TEXT
);
INSERT INTO accounts (id, holder, type, balance, opened_on) VALUES
  (1, 'Nisha Verma', 'savings', 15000.00, '2020-02-11'),
  (2, 'Ganesh Patil', 'current', 4200.50, '2021-07-19'),
  (3, 'Zoya Khan', 'savings', 980.00, '2022-03-30'),
  (4, 'Ramesh Iyer', 'current', 0.00, '2023-11-02');

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  posted_on TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('credit', 'debit')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  note TEXT
);
INSERT INTO transactions (id, account_id, posted_on, kind, amount, note) VALUES
  (1, 1, '2024-01-05', 'credit', 5000.00, 'salary'),
  (2, 1, '2024-01-18', 'debit', 1200.00, 'rent share'),
  (3, 2, '2024-02-02', 'credit', 9000.00, 'invoice 41'),
  (4, 2, '2024-02-14', 'debit', 3400.00, 'supplier'),
  (5, 3, '2024-03-03', 'debit', 180.00, 'atm'),
  (6, 4, '2024-03-21', 'credit', 500.00, 'opening gift');
`,
  },

  inventory: {
    id: "inventory",
    database: "inventory_db",
    title: "Warehouse stock",
    blurb: "Items, suppliers and stock movements — safe ground for UPDATE and DELETE.",
    tables: [
      { name: "items", purpose: "sku, category, quantity on hand and reorder level" },
      { name: "suppliers", purpose: "who supplies what, with a rating that may be NULL" },
      { name: "movements", purpose: "every increase or decrease of stock" },
    ],
    seed: `
CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  cost DECIMAL(10,2) NOT NULL
);
INSERT INTO items (id, sku, name, category, qty, reorder_level, cost) VALUES
  (1, 'WD-01', 'Desk Chair', 'furniture', 24, 10, 2499.00),
  (2, 'WD-02', 'Monitor Arm', 'furniture', 8, 12, 1799.00),
  (3, 'EL-11', 'HDMI Cable', 'electronics', 140, 50, 199.00),
  (4, 'EL-12', 'Docking Station', 'electronics', 5, 8, 6499.00),
  (5, 'OF-30', 'Printer Paper', 'office', 60, 40, 399.00),
  (6, 'OF-31', 'Whiteboard', 'office', 0, 4, 3299.00);

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  rating INTEGER
);
INSERT INTO suppliers (id, name, city, rating) VALUES
  (1, 'Vertex Logistics', 'Mumbai', 4),
  (2, 'BlueOak Furniture', 'Pune', 5),
  (3, 'Circuit World', 'Shenzhen', NULL),
  (4, 'Paper Trail Co', 'Goa', 3);

CREATE TABLE movements (
  id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  moved_on TEXT NOT NULL,
  change INTEGER NOT NULL,
  reason TEXT
);
INSERT INTO movements (id, item_id, supplier_id, moved_on, change, reason) VALUES
  (1, 1, 2, '2024-04-01', 10, 'purchase'),
  (2, 2, 2, '2024-04-03', -4, 'issue to floor'),
  (3, 3, 3, '2024-04-05', 100, 'purchase'),
  (4, 4, 3, '2024-04-11', -3, 'issue to floor'),
  (5, 5, 4, '2024-04-15', 25, 'purchase'),
  (6, 6, 2, '2024-04-20', -2, 'damaged'),
  (7, 1, 2, '2024-05-02', -6, 'issue to floor');
`,
  },

  clinic: {
    id: "clinic",
    database: "clinic_db",
    title: "Clinic records",
    blurb: "One messy spreadsheet and the clean tables it should have been.",
    tables: [
      { name: "messy_visits", purpose: "repeating groups and duplicated facts: the thing to fix" },
      { name: "patients", purpose: "one row per patient, facts stored once" },
      { name: "doctors", purpose: "one row per doctor" },
      { name: "visits", purpose: "one row per visit, keys only" },
      { name: "procedures", purpose: "the catalogue of procedures" },
      { name: "visit_procedures", purpose: "junction: which visit included which procedures" },
    ],
    seed: `
CREATE TABLE messy_visits (
  id INTEGER PRIMARY KEY,
  patient_name TEXT,
  patient_phone TEXT,
  doctor_name TEXT,
  doctor_specialty TEXT,
  procedures TEXT,
  visited_on TEXT
);
INSERT INTO messy_visits (id, patient_name, patient_phone, doctor_name, doctor_specialty, procedures, visited_on) VALUES
  (1, 'Kamala N.', '9991112222', 'Dr. Rao', 'Cardiology', 'ECG, ECG', '2024-01-04'),
  (2, 'Kamala N.', '9991112222', 'Dr. Rao', 'Cardiology', 'BP Check', '2024-02-09'),
  (3, 'Imran S.', '9820001111', 'Dr. Deka', 'Orthopaedics', 'X-Ray, Cast', '2024-02-15'),
  (4, 'Imran S.', '9820003333', 'Dr. Deka', 'Orthopaedics', 'X-Ray', '2024-03-22'),
  (5, 'Grace O.', '9745556666', 'Dr. Rao', 'Cardiology', 'ECG', '2024-04-11');

CREATE TABLE patients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT
);
INSERT INTO patients (id, name, phone) VALUES
  (1, 'Kamala N.', '9991112222'),
  (2, 'Imran S.', '9820003333'),
  (3, 'Grace O.', '9745556666');

CREATE TABLE doctors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT
);
INSERT INTO doctors (id, name, specialty) VALUES
  (1, 'Dr. Rao', 'Cardiology'),
  (2, 'Dr. Deka', 'Orthopaedics');

CREATE TABLE procedures (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL
);
INSERT INTO procedures (id, code, title) VALUES
  (1, 'ECG', 'Electrocardiogram'),
  (2, 'BP', 'Blood pressure check'),
  (3, 'XRAY', 'X-Ray'),
  (4, 'CAST', 'Plaster cast');

CREATE TABLE visits (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  visited_on TEXT NOT NULL
);
INSERT INTO visits (id, patient_id, doctor_id, visited_on) VALUES
  (1, 1, 1, '2024-01-04'),
  (2, 1, 1, '2024-02-09'),
  (3, 2, 2, '2024-02-15'),
  (4, 2, 2, '2024-03-22'),
  (5, 3, 1, '2024-04-11');

CREATE TABLE visit_procedures (
  visit_id INTEGER NOT NULL REFERENCES visits(id),
  procedure_id INTEGER NOT NULL REFERENCES procedures(id),
  PRIMARY KEY (visit_id, procedure_id)
);
INSERT INTO visit_procedures (visit_id, procedure_id) VALUES
  (1, 1),
  (2, 2),
  (3, 3), (3, 4),
  (4, 3),
  (5, 1);
`,
  },
};

export const DATASET_LIST: Dataset[] = Object.values(DATASETS);

/** The database name a lesson's dataset lives in. */
export function datasetDatabase(id: DatasetId): string {
  return DATASETS[id].database;
}
