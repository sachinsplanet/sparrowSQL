/**
 * Module 2 — Database and table creation.
 *
 * Structure first: this module lives in `practice_db`, the throwaway dataset, so a
 * learner can drop and rebuild tables without touching the data other modules read.
 */

import {
  dialect,
  diagram,
  example,
  exercise,
  h3,
  keyterms,
  list,
  mistake,
  prose,
  realWorld,
  sparrow,
  syntax,
  table,
  tip,
  warning,
  type Chapter,
  type Lesson,
} from "../types";

/**
 * The table several of this module's examples inspect. Each of them carries it as
 * `setup`, because the verification harness opens a fresh database per statement —
 * exactly like a learner who resets the sample data before trying again.
 */
const WORKSHOP_DDL =
  "CREATE TABLE workshop (\n  id INTEGER PRIMARY KEY,\n  topic VARCHAR(80) NOT NULL,\n  seats INTEGER NOT NULL DEFAULT 12,\n  cancelled INTEGER DEFAULT 0\n);";

const createDatabase: Lesson = {
  id: "m02-create-database",
  chapter: 2,
  order: 1,
  title: "Creating and choosing a database",
  summary: "CREATE DATABASE, USE, SHOW DATABASES and the naming rules that keep a schema readable.",
  minutes: 7,
  difficulty: "foundational",
  prerequisites: ["m01-inside-sparrowsql"],
  dataset: "practice",
  objectives: [
    "Create a database, select it, and prove you are inside it.",
    "Choose names that a colleague could read six months later.",
    "Drop a database deliberately, and know what disappears with it.",
  ],
  blocks: [
    prose(
      "A database is a namespace: it holds tables, and it lets two organisations keep a table called `orders` without colliding. MySQL-style servers also hold *databases inside databases* (`CREATE SCHEMA`), which is why you will see the words used almost interchangeably.",
    ),
    syntax(
      "CREATE DATABASE [IF NOT EXISTS] name;\nUSE name;\nSHOW DATABASES;\nDROP DATABASE [IF EXISTS] name;",
      "The four commands that move around at database level.",
    ),
    example(
      "CREATE DATABASE IF NOT EXISTS college_db;",
      "Idempotent on purpose: `IF NOT EXISTS` turns 'already there' from an error into a no-op, which is what you want in a setup script that may run twice.",
      { support: "mysql", dataset: "practice" },
    ),
    h3("Naming is a design decision"),
    list(
      [
        "Name the database after the *domain*, not the app version: `shop_db`, not `shop_v2_final`.",
        "Pick one case style and keep it. MySQL table names are case-sensitive on Linux, so `Orders` and `orders` can be two tables.",
        "Avoid reserved words (`order`, `group`, `select`, `table`). You will write `orders`, plural, for tables and a singular name for a key column.",
      ],
      false,
    ),
    example(
      "USE practice_db;",
      "`SELECT DATABASE()` afterwards prints the same name back to you — the quickest way to be sure where a statement is about to land.",
      { support: "mysql", dataset: "practice" },
    ),
    warning(
      "`DROP DATABASE` removes every table and every row inside it. There is no undo, in this sandbox or on a server. Practice the habit of `SHOW TABLES;` first, then decide.",
      "The most expensive statement",
    ),
    realWorld(
      "On a real server, `CREATE DATABASE` is usually done once by an engineer or a migration tool, and application code never issues it. Learners who type it inside a request handler end up with databases named after user input.",
    ),
    exercise({
      id: "m02-ex-makeroom",
      mode: "guided",
      prompt:
        "In `practice_db`, create a table called `workshop` with three columns: `id` (integer), `topic` (text) and `seats` (integer). Verify it exists with SHOW TABLES.",
      dataset: "practice",
      starter: "CREATE TABLE workshop (\n  id ____,\n  topic ____,\n  seats ____\n);",
      expected: { type: "table-exists", tableName: "workshop" },
      hints: [
        "Each column is `name TYPE`, separated by commas.",
        "The three types you need are INTEGER, TEXT (or VARCHAR(80)) and INTEGER.",
        "Then run SHOW TABLES; to see it in the list.",
      ],
      solution:
        "CREATE TABLE workshop (id INTEGER, topic VARCHAR(80), seats INTEGER); SHOW TABLES;",
      success: "workshop is in the table list. You created structure, not data.",
      xp: 15,
      extend: {
        prompt: "Drop the table, then re-create it with IF NOT EXISTS and run the script twice.",
      },
    }),
  ],
  quiz: [
    {
      kind: "choice",
      id: "m02-q-ifnotexists",
      prompt: "Why do setup scripts write `CREATE DATABASE IF NOT EXISTS app_db;`?",
      options: [
        "It creates the database faster.",
        "Re-running the script does not fail when the database is already there.",
        "It also creates the tables inside.",
        "It prevents anyone else from using the name.",
      ],
      answerIndex: 1,
      explain: "Idempotence: the second run is a no-op instead of error 1007 'database exists'.",
    },
    {
      kind: "fill",
      id: "m02-fill-use",
      prompt: "Point your session at shop_db.",
      before: "",
      after: " shop_db;",
      accept: ["USE", "use"],
      explain: "`USE shop_db;` selects the current database for the statements that follow.",
    },
  ],
  recap: [
    "CREATE / USE / SHOW / DROP DATABASE move you around namespaces.",
    "Plural table names, one case style, no reserved words.",
    "IF NOT EXISTS and IF EXISTS make scripts re-runnable.",
  ],
};

const createTable: Lesson = {
  id: "m02-create-table",
  chapter: 2,
  order: 2,
  title: "CREATE TABLE, column by column",
  summary: "The anatomy of a table definition: name, type, per-column rules, and a table-level constraint.",
  minutes: 9,
  difficulty: "core",
  prerequisites: ["m02-create-database"],
  dataset: "practice",
  objectives: [
    "Write a CREATE TABLE statement with a primary key and NOT NULL columns.",
    "Explain what a table constraint does that a column constraint cannot.",
    "Read back the definition the engine actually stored.",
  ],
  blocks: [
    syntax(
      "CREATE TABLE [IF NOT EXISTS] table_name (\n  column_name  data_type  [column constraint],\n  ...,\n  [table constraint]\n);",
      "Columns first, then any constraint that spans more than one column.",
    ),
    prose(
      "A table definition answers three questions per column: what is it called, what kind of thing goes in it, and what is not allowed. MySQL has a wide type menu (Module 3); the shape below is what you will type most days.",
    ),
    example(
      "CREATE TABLE IF NOT EXISTS workshop (\n  id INTEGER PRIMARY KEY,\n  topic VARCHAR(80) NOT NULL,\n  seats INTEGER NOT NULL DEFAULT 12,\n  cancelled INTEGER DEFAULT 0\n);",
      "Four columns, three different kinds of rule: `id` is the key, `topic` must be present, `seats` falls back to 12 when an INSERT leaves it out, and `cancelled` is a 0/1 flag. `INTEGER` in place of BOOLEAN is the conventional choice in this engine.",
      { dataset: "practice" },
    ),
    tip(
      "`VARCHAR(80)` is a maximum length, not a reserved one: 'SQL basics' costs 9 characters, not 80.",
      "Length is a limit",
    ),
    h3("Column vs table constraint"),
    table(
      "Where a rule can live",
      ["Spelled as", "Example", "When you need it"],
      [
        ["column constraint", "seats INTEGER NOT NULL", "the rule is about one column"],
        ["column CHECK", "seats INTEGER CHECK (seats > 0)", "the rule tests one column's value"],
        [
          "table constraint",
          "PRIMARY KEY (a_id, b_id)",
          "the rule spans several columns, or you want them listed together",
        ],
      ],
    ),
    example(
      "CREATE TABLE enrollment (\n  workshop_id INTEGER NOT NULL,\n  learner_id INTEGER NOT NULL,\n  joined_on TEXT,\n  PRIMARY KEY (workshop_id, learner_id)\n);",
      "A composite primary key: one row per workshop-and-learner pair, and no separate `id` column. You will meet this exact shape again in the many-to-many lesson.",
      { dataset: "practice" },
    ),
    example(
      "SHOW CREATE TABLE workshop;",
      "The definition as the engine stored it. Useful when a colleague's script and the live table have drifted apart.",
      { support: "mysql", dataset: "practice", setup: WORKSHOP_DDL },
    ),
    mistake(
      "CREATE TABLE orders (id INT, customer_id INT, …) with no keys at all.",
      "Everything runs, and the table slowly fills with rows you cannot address or de-duplicate.",
      "A keyless table has no way to say 'this row', so UPDATE and DELETE end up matching by value — and values repeat.",
      "Decide the key while you create the table, not afterwards: `id INTEGER PRIMARY KEY`.",
    ),
    dialect(
      "MySQL's `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` tail is a server setting; this sandbox removes it and tells you. In real MySQL, InnoDB is the engine that gives you foreign keys and transactions, so a MyISAM table silently ignores both.",
    ),
    sparrow(
      "Type the definition once by hand, alignment and all. Reading CREATE TABLE is easy; writing it from memory is what makes the shape stick.",
      "Do it by hand",
    ),
  ],
  quiz: [
    {
      kind: "choice",
      id: "m02-q-composite",
      prompt: "What does `PRIMARY KEY (post_id, tag_id)` guarantee?",
      options: [
        "Every post has at least one tag.",
        "The pair (post_id, tag_id) appears at most once, and neither column is NULL.",
        "post_id and tag_id must hold the same value.",
        "The table is sorted by post_id.",
      ],
      answerIndex: 1,
      explain:
        "A composite key is uniqueness across the listed columns, and primary-key columns are implicitly NOT NULL.",
    },
    {
      kind: "diagnose",
      id: "m02-diag-comma",
      prompt: "Why does this fail?",
      sql: "CREATE TABLE t (\n  a INTEGER,\n  b INTEGER\n  c INTEGER\n);",
      error: "near \"c\": syntax error",
      options: [
        "You cannot have three columns in one table.",
        "The comma after b INTEGER is missing, so 'b INTEGER c INTEGER' is not a column definition.",
        "c is a reserved word.",
        "The table name needs to be quoted.",
      ],
      answerIndex: 1,
      explain: "Column definitions are a comma-separated list. A missing comma is the most common DDL error there is.",
    },
  ],
  recap: [
    "One line per column: name, type, rules — plus table-level constraints at the end.",
    "Composite keys express 'this pair is unique'.",
    "SHOW CREATE TABLE reveals the truth the engine kept.",
  ],
};

const keysLesson: Lesson = {
  id: "m02-keys-autoincrement",
  chapter: 2,
  order: 3,
  title: "Keys, AUTO_INCREMENT and identity",
  summary: "How a row gets an id, why the database assigns it, and how to ask what number you just got.",
  minutes: 8,
  difficulty: "core",
  prerequisites: ["m02-create-table"],
  dataset: "practice",
  objectives: [
    "Declare an auto-numbered primary key and let the database fill it in.",
    "Retrieve the identifier created by the last INSERT.",
    "Choose between a surrogate id and a natural key.",
  ],
  blocks: [
    prose(
      "If the database must hand every row a different number, nobody inserting a row has to invent one first. That is `AUTO_INCREMENT` in MySQL: the counter lives with the column and moves forward on each insert.",
    ),
    example(
      "CREATE TABLE ticket (\n  id INTEGER PRIMARY KEY AUTO_INCREMENT,\n  label VARCHAR(60) NOT NULL\n);",
      "In this sandbox the note under the result explains that SQLite spells the same idea `INTEGER PRIMARY KEY AUTOINCREMENT`. The declaration order matters: MySQL accepts `AUTO_INCREMENT` before or after PRIMARY KEY; the rewrite needs the column to be an INTEGER primary key.",
      { dataset: "practice", support: "rewritten" },
    ),
    example(
      "INSERT INTO ticket (label) VALUES ('bus pass');",
      "No id supplied — the counter filled it in. Read the 'Query OK' line: one row affected.",
      { dataset: "practice", setup: "CREATE TABLE ticket (id INTEGER PRIMARY KEY AUTO_INCREMENT, label VARCHAR(60) NOT NULL);" },
    ),
    example(
      "SELECT id, label FROM ticket ORDER BY id;",
      "The rows you have inserted, with the identifiers the database chose. Because the key is assigned by the engine, it is guaranteed not to repeat even if two labels are identical.",
      {
        dataset: "practice",
        setup:
          "CREATE TABLE ticket (id INTEGER PRIMARY KEY AUTO_INCREMENT, label VARCHAR(60) NOT NULL);\nINSERT INTO ticket (label) VALUES ('bus pass'), ('bus pass');",
        expected: { columns: ["id", "label"], ordered: true, rows: [[1, "bus pass"], [2, "bus pass"]] },
      },
    ),
    h3("What did I just create?"),
    example(
      "SELECT last_insert_id() AS new_id;",
      "The identifier of the row you inserted last, in this session. It is how a two-step script links a parent to its children: insert the order, read its id, insert the lines with that id.",
      {
        dataset: "practice",
        setup: "CREATE TABLE ticket (id INTEGER PRIMARY KEY AUTO_INCREMENT, label VARCHAR(60) NOT NULL);\nINSERT INTO ticket (label) VALUES ('metro card');",
        support: "rewritten",
        expected: { columns: ["new_id"], rows: [[1]] },
      },
    ),
    dialect(
      "`LAST_INSERT_ID()` (MySQL) became `last_insert_rowid()` (SQLite). Same idea, same session-scoped guarantee; only the name changes. Note that both answer about *your* connection, not about the most recent insert in the whole server.",
    ),
    table(
      "Surrogate key vs natural key",
      ["Kind", "Example", "Strength", "Risk"],
      [
        ["Surrogate", "id = 4187", "never changes, never repeats, short to index", "means nothing to a human"],
        ["Natural", "email, isbn, sku", "meaningful, arrives with the data", "gets corrected, reused or recycled"],
      ],
    ),
    tip(
      "Give the table a surrogate id anyway, and put UNIQUE on the natural key. You get a stable pointer and a duplicate guard.",
      "Both, not either",
    ),
    exercise({
      id: "m02-ex-autoid",
      mode: "challenge",
      prompt:
        "Create `chore` with an auto-numbered `id`, a `task` column that cannot be empty and a `done` column defaulting to 0. Then insert one row naming a task of your choice, without mentioning the id.",
      dataset: "practice",
      expected: { type: "row-count", tableName: "chore", rowCount: 1 },
      hints: [
        "Two statements: CREATE TABLE …, then INSERT INTO chore (task) VALUES ('…').",
        "The checker only needs one row to exist in `chore`.",
        "done should fall out of the DEFAULT, not be typed.",
      ],
      solution:
        "CREATE TABLE chore (id INTEGER PRIMARY KEY AUTO_INCREMENT, task VARCHAR(80) NOT NULL, done INTEGER DEFAULT 0);\nINSERT INTO chore (task) VALUES ('wash dishes');\nSELECT id, task, done FROM chore WHERE id = 1;",
      success: "The engine assigned the id, your NOT NULL column was supplied, and the default filled in.",
      xp: 25,
    }),
  ],
  quiz: [
    {
      kind: "predict",
      id: "m02-predict-autoinc",
      prompt:
        "`chore` holds three rows. You delete the highest id and then insert one more auto-numbered row without naming the id. What does `SELECT COUNT(*) FROM chore;` print, and what id did the new row get?",
      sql: "SELECT COUNT(*) AS rows_now FROM scratchpad;",
      dataset: "practice",
      options: ["3 rows, and the new row reused the freed id", "3 rows, and the new id is one past the highest ever used", "2 rows, because the delete is undone", "The insert fails while a gap exists"],
      answerIndex: 1,
      explain:
        "The count returns to 3, and the counter never looks backwards, so the id skips the hole. Gaps in ids are normal and harmless; they are not missing data.",
    },
    {
      kind: "choice",
      id: "m02-q-natural",
      prompt: "Why is email a poor sole primary key for a `users` table?",
      options: [
        "It is too short.",
        "People change and share addresses, so the key would have to change.",
        "Text cannot be a primary key.",
        "It cannot be indexed.",
      ],
      answerIndex: 1,
      explain:
        "A primary key is referenced by other tables. When the value changes, every reference has to move with it — which is why a stable surrogate id usually carries the relationship.",
    },
  ],
  recap: [
    "AUTO_INCREMENT (AUTOINCREMENT here) lets the engine own identity.",
    "last_insert_id() links a parent row to children inserted right after it.",
    "Surrogate id for relationships, natural key for uniqueness.",
  ],
};

const alterDrop: Lesson = {
  id: "m02-alter-drop-inspect",
  chapter: 2,
  order: 4,
  title: "Changing and removing structure",
  summary: "ALTER TABLE, DROP TABLE, and the inspection commands that tell you what a database really contains.",
  minutes: 8,
  difficulty: "core",
  prerequisites: ["m02-create-table"],
  dataset: "practice",
  objectives: [
    "Add and rename columns, and know which changes this engine refuses.",
    "Drop a table and predict what happens to its rows.",
    "Use SHOW TABLES / DESCRIBE / SHOW INDEX to inspect a schema.",
  ],
  blocks: [
    syntax(
      "ALTER TABLE table_name ADD COLUMN column_name datatype constraint;\nALTER TABLE table_name DROP COLUMN column_name;\nALTER TABLE table_name RENAME TO new_table_name;\nALTER TABLE table_name CHANGE COLUMN old_name new_name new_datatype;\nALTER TABLE table_name MODIFY COLUMN col_name new_datatype;",
      "The five main ways to alter a table schema.",
    ),
    example(
      "ALTER TABLE workshop ADD COLUMN room VARCHAR(20) DEFAULT 'A1';",
      "Adding a column is cheap and safe: existing rows take the default. Every structural change else (retype, rename a column, drop a column with data in it) is where engines disagree — see the note below.",
      {
        dataset: "practice",
        setup: WORKSHOP_DDL,
      },
    ),
    diagram(
      "flow",
      "What each structural statement is allowed to do",
      [
        { label: "ADD COLUMN", note: "standard SQL, safe", tone: "default" },
        { label: "RENAME TO", note: "renames table", tone: "default" },
        { label: "DROP COLUMN", note: "supported by modern engines", tone: "default" },
        { label: "CHANGE / MODIFY", note: "MySQL yes, SQLite requires table rebuild", tone: "accent" },
      ],
    ),
    mistake(
      "ALTER TABLE students MODIFY marks DECIMAL(5,2);",
      "'ALTER TABLE … MODIFY' is refused: SQLite cannot retype an existing column in place.",
      "MySQL rewrites the table for you when you change a column type. SQLite refuses rather than silently rebuilding a table that other code depends on.",
      "Create a new table with the wanted definition, copy the rows across with INSERT … SELECT, then drop the old one and rename. Module 10 walks through that migration.",
    ),
    h3("Inspecting what exists"),
    example(
      "SHOW TABLES;",
      "Every table in the current database, one per row. This is the answer to 'what am I working with?'",
      { support: "mysql", dataset: "practice" },
    ),
    example(
      "SHOW INDEX FROM workshop;",
      "Indexes the engine knows about, including the automatic one behind the primary key. Module 11 uses this to talk about performance.",
      { support: "mysql", dataset: "practice", setup: WORKSHOP_DDL },
    ),
    example(
      "DROP TABLE IF EXISTS ticket;",
      "Structure and rows both go. `IF EXISTS` keeps the script running when the table is already gone — the same idempotence habit from CREATE.",
      {
        dataset: "practice",
        setup: "CREATE TABLE ticket (id INTEGER PRIMARY KEY, label VARCHAR(60));",
      },
    ),
    warning(
      "TRUNCATE empties a table but keeps its definition. In this sandbox it becomes DELETE FROM, which does not reset the auto-increment counter and *can* be rolled back inside a transaction — a real difference from MySQL, and one the note tells you about.",
      "TRUNCATE vs DELETE",
    ),
    keyterms([
      { term: "schema", def: "the structure of a database: its tables, columns and constraints." },
      { term: "migration", def: "a scripted, reversible change to a schema." },
      { term: "DDL", def: "data definition language: CREATE, ALTER, DROP." },
      { term: "idempotent", def: "safe to run twice: IF NOT EXISTS, IF EXISTS." },
    ]),
    sparrow(
      "When a schema question comes up in a job, nobody memorises the tables. They run SHOW TABLES, then DESCRIBE on the two that matter. Do that here and it becomes a reflex.",
      "The two commands that start every investigation",
    ),
  ],
  quiz: [
    {
      kind: "fill",
      id: "m02-fill-add",
      prompt: "Add a nullable `notes TEXT` column to the products table.",
      before: "ALTER TABLE products ",
      after: " notes TEXT;",
      accept: ["ADD COLUMN", "ADD"],
      explain: "ADD (COLUMN) appends a column; existing rows get NULL for it.",
    },
    {
      kind: "choice",
      id: "m02-q-drop",
      prompt: "Which statement removes rows but keeps the table definition?",
      options: ["DROP TABLE t;", "TRUNCATE TABLE t;", "DELETE DATABASE t;", "ALTER TABLE t DROP ROWS;"],
      answerIndex: 1,
      explain:
        "TRUNCATE empties the table. DROP TABLE removes the table itself; the other two are not statements.",
    },
  ],
  recap: [
    "ADD / RENAME / DROP are structure changes; only ADD is universally safe.",
    "Retyping a column means recreate → copy → swap in this engine.",
    "SHOW TABLES, DESCRIBE and SHOW INDEX answer 'what is really here?'.",
  ],
};

export const moduleTwoChapter: Chapter = {
  number: 2,
  id: "module-2",
  title: "Database & Table Creation",
  kicker: "Module 2",
  blurb: "Namespaces, table definitions, identity, and the inspection commands that orient you in any schema.",
  module: 2,
  kind: "module",
  lessons: [createDatabase, createTable, keysLesson, alterDrop],
  review: [
    {
      kind: "choice",
      id: "m02-r1",
      prompt: "You need one row per (student, course) pair and no duplicates. Which definition expresses that best?",
      options: [
        "id INTEGER PRIMARY KEY, student_id INTEGER, course_id INTEGER",
        "student_id INTEGER, course_id INTEGER, PRIMARY KEY (student_id, course_id)",
        "student_id INTEGER UNIQUE, course_id INTEGER UNIQUE",
        "student_id INTEGER, course_id INTEGER",
      ],
      answerIndex: 1,
      explain: "The composite key is exactly the rule 'this pair appears once'.",
    },
    {
      kind: "fill",
      id: "m02-r2",
      prompt: "Make this script safe to run a second time.",
      before: "CREATE TABLE ",
      after: " workshop (id INTEGER PRIMARY KEY);",
      accept: ["IF NOT EXISTS"],
      explain: "Without it, the second run fails with 'table workshop already exists'.",
    },
    {
      kind: "predict",
      id: "m02-r3",
      prompt: "How many rows does the last statement return?",
      sql: "CREATE TABLE probe (a INTEGER);\nINSERT INTO probe VALUES (1), (2), (3);\nDELETE FROM probe WHERE a = 2;\nSELECT COUNT(*) AS left_now FROM probe;",
      dataset: "practice",
      options: ["3", "2", "1", "0"],
      answerIndex: 1,
      explain: "Three inserted, one deleted by value, two remain. COUNT(*) is the alias `left_now`.",
    },
  ],
};
