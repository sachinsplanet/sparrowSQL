/**
 * Capstone project data.
 *
 * Three projects, in the order a course would set them: build a schema from a
 * written brief (student management), answer questions about transactions
 * (e-commerce), and turn a dataset into a manager's dashboard (sales analytics).
 *
 * `schema` and `starterData` are idempotent on purpose — `IF NOT EXISTS` plus
 * `INSERT OR IGNORE` — so the book can prepare a database before a milestone
 * without ever fighting a learner's own work, and so the harness can verify each
 * milestone independently of the ones before it.
 */

import type { Capstone } from "./types";

/* ---------------------------------------------------- A: student management */

const SMS_SCHEMA = `CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  title VARCHAR(80) NOT NULL UNIQUE,
  credits INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 10)
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY,
  reg_code VARCHAR(12) NOT NULL UNIQUE,
  name VARCHAR(60) NOT NULL,
  city VARCHAR(40),
  joined_on TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  grade INTEGER CHECK (grade BETWEEN 0 AND 100),
  UNIQUE (student_id, course_id)
);`;

const SMS_DATA = `INSERT OR IGNORE INTO courses (id, title, credits) VALUES
  (1, 'Web Development', 3),
  (2, 'Data Science', 4),
  (3, 'Design', 3);

INSERT OR IGNORE INTO students (id, reg_code, name, city, joined_on) VALUES
  (101, 'CS-2401', 'Anjali Sharma', 'Pune', '2024-06-01'),
  (102, 'CS-2402', 'Rahul Nair', 'Mumbai', '2024-06-01'),
  (103, 'CS-2403', 'Priya Desai', 'Pune', '2024-06-03'),
  (104, 'EC-2410', 'Vikram Bose', 'Delhi', '2024-06-05'),
  (105, 'EC-2411', 'Meera Rao', 'Chennai', '2024-06-05');

INSERT OR IGNORE INTO enrollments (id, student_id, course_id, grade) VALUES
  (1, 101, 1, 91),
  (2, 101, 2, 84),
  (3, 102, 1, 70),
  (4, 103, 3, 95),
  (5, 104, 2, 61),
  (6, 105, 3, 88);`;

/* ------------------------------------------------------------- B: e-commerce */

const SHOP_SCHEMA = `CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  city VARCHAR(40),
  joined_on TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  title VARCHAR(80) NOT NULL,
  category VARCHAR(30) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_on TEXT NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL
);`;

/* ---------------------------------------------------------- C: sales reports */

export const CAPSTONES: Capstone[] = [
  {
    id: "capstone-students",
    number: 1,
    title: "Student Management Database",
    level: "beginner",
    minutes: 45,
    dataset: "practice",
    problem:
      "A small college keeps its register in three spreadsheets that disagree. Your job is to design one database that holds courses, students and enrollments, load the term's rows into it, and produce the report the registrar asks for every week.",
    brief: [
      "Each course has a title, a credit count between 1 and 10, and a title no other course shares.",
      "Each student has a registration code (unique), a name, an optional city and a join date.",
      "An enrollment links one student to one course, may hold a grade from 0 to 100, and a student may take a given course only once.",
      "A student row must never be able to point at a course that does not exist.",
    ],
    schema: SMS_SCHEMA,
    starterData: SMS_DATA,
    skills: [
      "Reading a written brief and turning it into columns",
      "Choosing keys and constraints that express the rules",
      "Inserting parent rows before child rows",
      "Reporting across three tables with JOIN and GROUP BY",
    ],
    milestones: [
      {
        id: "cap1-m1",
        title: "Create the three tables",
        requirement:
          "Write the DDL for `courses`, `students` and `enrollments` in `practice_db`, including the primary keys, the unique registration code, the credit and grade ranges, and the two foreign keys.",
        successCriteria:
          "SHOW TABLES lists all three, and DESCRIBE on each shows the constraints you wrote.",
        hints: [
          "Create `courses` and `students` before `enrollments`: a foreign key cannot point at a table that is not there yet.",
          "A range is a CHECK: CHECK (credits BETWEEN 1 AND 10).",
          "'A student takes a course only once' is a table constraint: UNIQUE (student_id, course_id).",
        ],
        solution: SMS_SCHEMA,
        expected: { type: "table-exists", tableName: "enrollments" },
        dataset: "practice",
      },
      {
        id: "cap1-m2",
        title: "Load the term's rows",
        requirement:
          "Insert three courses, five students and six enrollments, using the values printed on the brief page. Add the foreign-keyed rows last.",
        successCriteria: "SELECT COUNT(*) FROM enrollments; returns 6, and no insert was refused.",
        hints: [
          "List the columns you are filling in every INSERT — it survives a schema change and reads better.",
          "Grades are the last thing you write into an enrollment; a student who has just joined may have none (NULL).",
          "Order of work: courses, then students, then enrollments.",
        ],
        prepare: "schema",
        solution: SMS_DATA,
        expected: { type: "row-count", tableName: "enrollments", rowCount: 6 },
        dataset: "practice",
      },
      {
        id: "cap1-m3",
        title: "The registrar's weekly report",
        requirement:
          "For every course, show how many students are enrolled and the average grade, best average first. Round the average to one decimal place.",
        successCriteria:
          "Three rows: Design 91.5, Web Development 80.5, Data Science 72.5, each with two seats.",
        hints: [
          "You need courses joined to enrollments: the count and the average come from the enrollment rows.",
          "GROUP BY the course title, and remember ROUND(AVG(grade), 1).",
          "Aliasing the columns (AS course, AS seats, AS average) makes the result readable, which is the point of a report.",
        ],
        prepare: "both",
        solution:
          "SELECT c.title AS course, COUNT(e.id) AS seats, ROUND(AVG(e.grade), 1) AS average\nFROM courses c\nJOIN enrollments e ON e.course_id = c.id\nGROUP BY c.title\nORDER BY average DESC;",
        expected: {
          type: "result-set",
          ordered: true,
          columns: ["course", "seats", "average"],
          rows: [
            ["Design", 2, 91.5],
            ["Web Development", 2, 80.5],
            ["Data Science", 2, 72.5],
          ],
        },
        dataset: "practice",
      },
    ],
  },

  {
    id: "capshop",
    number: 2,
    title: "E-commerce Database",
    level: "intermediate",
    minutes: 60,
    dataset: "shop",
    problem:
      "An online shop keeps customers, a catalogue, orders and the lines inside each order. The owner asks four questions every Monday, and each one is answered by joining `orders` to `order_items` — with one important catch: cancelled orders are not revenue.",
    brief: [
      "An order belongs to exactly one customer and contains one or more lines.",
      "Each line records the product, how many were bought, and the price charged at that moment (`unit_price`, not the current `products.price`).",
      "Order status is one of new, paid, shipped, cancelled. Only cancelled orders are excluded from revenue.",
      "`shop_db` already holds six customers, six products, six orders and eight lines; design the same structure yourself in `practice_db` first.",
    ],
    schema: SHOP_SCHEMA,
    starterData:
      "See the Module 2 and Module 8 lessons for the same four tables already populated; `shop_db` is pre-loaded for the reporting milestones.",
    skills: [
      "Modelling a two-level parent/child structure (order → lines)",
      "Storing a price at the time of sale",
      "Aggregating across a join without double-counting",
      "Excluding a status from a business number",
    ],
    milestones: [
      {
        id: "cap2-m1",
        title: "Model orders and their lines",
        requirement:
          "In `practice_db`, create the four tables above. The order line must reference both an order and a product, and its quantity must be positive.",
        successCriteria: "SHOW TABLES lists customers, products, orders and order_items.",
        hints: [
          "`unit_price` belongs on the line: prices change, and history must not be rewritten.",
          "Two foreign keys on one table is normal: order_id and product_id.",
          "DECIMAL(10,2) for money, INTEGER for counts.",
        ],
        solution: SHOP_SCHEMA,
        expected: { type: "table-exists", tableName: "order_items" },
        dataset: "practice",
      },
      {
        id: "cap2-m2",
        title: "What did each order earn?",
        requirement:
          "Report every order that was not cancelled with its total (quantity × unit price summed over its lines), lowest order id first.",
        successCriteria:
          "Five rows: 1 → 2897, 2 → 899.5, 3 → 14498, 5 → 699, 6 → 2499. Order 4 is missing because it was cancelled.",
        hints: [
          "Start from `orders`, join `order_items`, filter the status, then GROUP BY the order.",
          "The total is SUM(quantity * unit_price) — the multiplication happens per line, the sum per order.",
          "Excluding one status is cleaner as <> 'cancelled' than as three separate = tests.",
        ],
        solution:
          "SELECT o.id AS order_id, SUM(oi.quantity * oi.unit_price) AS total\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nWHERE o.status <> 'cancelled'\nGROUP BY o.id\nORDER BY o.id;",
        expected: {
          type: "result-set",
          ordered: true,
          columns: ["order_id", "total"],
          rows: [
            [1, 2897],
            [2, 899.5],
            [3, 14498],
            [5, 699],
            [6, 2499],
          ],
        },
        dataset: "shop",
      },
      {
        id: "cap2-m3",
        title: "Best sellers, excluding cancellations",
        requirement:
          "Rank the products by units sold across all non-cancelled orders, most sold first, breaking ties by product name so the report is stable.",
        successCriteria:
          "Five rows: Mouse 3, Keyboard 2, then Desk Lamp, Standing Desk and Webcam with 1 each. Notebook is absent because its only sale was cancelled.",
        hints: [
          "Join lines to orders (to filter status) and to products (for the title).",
          "SUM(oi.quantity) is the units figure; the status filter must happen before the grouping, in WHERE.",
          "ORDER BY units DESC, product — a tie-break makes the ranking repeatable.",
        ],
        solution:
          "SELECT p.title AS product, SUM(oi.quantity) AS units\nFROM order_items oi\nJOIN orders o ON o.id = oi.order_id\nJOIN products p ON p.id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.title\nORDER BY units DESC, product;",
        expected: {
          type: "result-set",
          ordered: true,
          columns: ["product", "units"],
          rows: [
            ["Mouse", 3],
            ["Keyboard", 2],
            ["Desk Lamp", 1],
            ["Standing Desk", 1],
            ["Webcam", 1],
          ],
        },
        dataset: "shop",
        extend: {
          prompt:
            "Now the grand total of the same filtered lines, in one extra query. It should print 21492.5 — and match the sum of milestone 2's five totals.",
          solution:
            "SELECT SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nJOIN orders o ON o.id = oi.order_id\nWHERE o.status <> 'cancelled';",
        },
      },
    ],
  },

  {
    id: "cap-sales",
    number: 3,
    title: "Sales Analytics Database",
    level: "advanced",
    minutes: 75,
    dataset: "sales",
    problem:
      "A sales director wants a dashboard: revenue by region, who is top of their region, and how the half-year trend looks with a running total. `sales_db` holds four regions, five salespeople and twelve closed deals — enough to reason about, small enough to check by eye.",
    brief: [
      "Every deal belongs to one salesperson; every salesperson belongs to one region.",
      "Revenue per region is the sum of that region's people's deals — never the sum of a join that counted a deal twice.",
      "'Top of region' means a rank inside each region, not one global ranking.",
      "The running total is cumulative by month, in month order.",
    ],
    schema:
      "regions(id, name, country) · salespersons(id, name, region_id → regions, hired_on, salary) · deals(id, salesperson_id → salespersons, closed_on, amount, channel)",
    starterData:
      "12 deals between January and June 2024 across three channels: online ₹61,300, direct ₹43,600, partner ₹27,300.",
    skills: [
      "Multi-table aggregation with two joins",
      "Window functions for rank and running totals",
      "CTEs to build a report in readable stages",
      "Proving a number two different ways",
    ],
    milestones: [
      {
        id: "cap3-m1",
        title: "Revenue by region",
        requirement:
          "One row per region with its total revenue and its number of closed deals, richest region first.",
        successCriteria: "South 49300 (5 deals), North 38400 (3), Gulf 33000 (2), Midwest 11500 (2).",
        hints: [
          "Two joins: deals → salespersons → regions.",
          "COUNT(d.id) counts the deals that survived the join; COUNT(r.id) would count something else.",
          "The four region totals must add up to 132200, which is the whole table — check that with a second query.",
        ],
        solution:
          "SELECT r.name AS region, SUM(d.amount) AS revenue, COUNT(d.id) AS deals\nFROM deals d\nJOIN salespersons s ON s.id = d.salesperson_id\nJOIN regions r ON r.id = s.region_id\nGROUP BY r.name\nORDER BY revenue DESC;",
        expected: {
          type: "result-set",
          ordered: true,
          columns: ["region", "revenue", "deals"],
          rows: [
            ["South", 49300, 5],
            ["North", 38400, 3],
            ["Gulf", 33000, 2],
            ["Midwest", 11500, 2],
          ],
        },
        dataset: "sales",
      },
      {
        id: "cap3-m2",
        title: "Top of each region",
        requirement:
          "Rank every salesperson inside their own region by revenue, best first, using a window function over a CTE that totals each person's deals.",
        successCriteria:
          "Leela is 1 in region 2 with Kavya 2 behind her; everyone else is 1 in their region.",
        hints: [
          "First build the per-person total in a CTE — a window function on top of raw deals would count each deal as its own row.",
          "RANK() OVER (PARTITION BY region_id ORDER BY rev DESC) gives 1 to the leader of every region.",
          "Use RANK, not ROW_NUMBER, if you want two equal earners to share a place.",
        ],
        solution:
          "WITH per_person AS (\n  SELECT s.id, s.name AS person, s.region_id, SUM(d.amount) AS rev\n  FROM salespersons s\n  JOIN deals d ON d.salesperson_id = s.id\n  GROUP BY s.id, s.name, s.region_id\n)\nSELECT person, region_id, RANK() OVER (PARTITION BY region_id ORDER BY rev DESC) AS rnk\nFROM per_person\nORDER BY region_id, rnk;",
        expected: {
          type: "result-set",
          ordered: true,
          columns: ["person", "region_id", "rnk"],
          rows: [
            ["Arjun", 1, 1],
            ["Leela", 2, 1],
            ["Kavya", 2, 2],
            ["Ravi", 3, 1],
            ["Nadia", 4, 1],
          ],
        },
        dataset: "sales",
      },
      {
        id: "cap3-m3",
        title: "Month by month, with a running total",
        requirement:
          "Report each month's revenue and the cumulative total to date, in month order, for January to June 2024.",
        successCriteria:
          "19500, 25200, 26300, 17100, 21900, 22200 — the last running total is 132200.",
        hints: [
          "strftime('%Y-%m', closed_on) labels a row with its month; group by that expression.",
          "The running total is SUM(SUM(amount)) OVER (ORDER BY month) — an aggregate inside a window.",
          "Prove it twice: the final running total must equal SELECT SUM(amount) FROM deals.",
        ],
        solution:
          "SELECT strftime('%Y-%m', closed_on) AS month,\n       SUM(amount) AS revenue,\n       SUM(SUM(amount)) OVER (ORDER BY strftime('%Y-%m', closed_on)) AS running_total\nFROM deals\nGROUP BY month\nORDER BY month;",
        expected: {
          type: "result-set",
          ordered: true,
          columns: ["month", "revenue", "running_total"],
          rows: [
            ["2024-01", 19500, 19500],
            ["2024-02", 25200, 44700],
            ["2024-03", 26300, 71000],
            ["2024-04", 17100, 88100],
            ["2024-05", 21900, 110000],
            ["2024-06", 22200, 132200],
          ],
        },
        dataset: "sales",
      },
    ],
  },
];

export { SMS_SCHEMA, SMS_DATA, SHOP_SCHEMA };
