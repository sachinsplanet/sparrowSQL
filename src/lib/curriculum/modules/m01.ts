/**
 * Module 1 — Database and SQL foundations.
 *
 * Before a learner types a statement they need a mental model: a database is a
 * set of tables, a table is a set of rows, and SQL is the language that asks
 * questions about them. Every example here is deliberately readable as a picture.
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
  sparrow,
  syntax,
  table,
  tip,
  warning,
  type Lesson,
} from "../types";
import type { Chapter } from "../types";

const databases: Lesson = {
  id: "m01-databases",
  chapter: 1,
  order: 1,
  title: "What a database is",
  summary:
    "A database is a stored collection of tables that many programs read and write at once — and the reason a spreadsheet stops working at that job.",
  minutes: 7,
  difficulty: "foundational",
  prerequisites: [],
  dataset: "college",
  objectives: [
    "Say in one sentence what a database adds that a file or a spreadsheet does not.",
    "Name the three things every database in this course gives you: tables, rows, columns.",
    "Explain why 'structured' matters more than 'big' when choosing a database.",
  ],
  blocks: [
    prose(
      "A **database** is a collection of interrelated data stored in a format that can be easily accessed. A **DBMS** (*Database Management System*) is software used to create, manage, and organize databases. An **RDBMS** (*Relational Database Management System*) is a DBMS based on the concept of tables (relations) with rows (records/tuples) and columns (attributes/fields), such as MySQL, PostgreSQL, Oracle, and Microsoft SQL Server.",
    ),
    table(
      "Relational (RDBMS) vs Non-relational (NoSQL) Databases",
      ["Category", "Storage Model", "Examples", "Query Language"],
      [
        ["Relational (RDBMS)", "Data stored in tables with rows and columns", "MySQL, PostgreSQL, Oracle, SQL Server", "SQL"],
        ["Non-relational (NoSQL)", "Data not stored in tables (documents, graphs, key-values)", "MongoDB, Redis, Cassandra", "Database-specific APIs"],
      ],
    ),
    h3("The problem a database solves"),
    prose(
      "A spreadsheet can hold 500 students perfectly happily. It stops being enough when two people edit it at once, when a teacher wants the average mark of one course only, when a wrong mark must be refused, or when the file grows to a million rows. A database server answers those four problems with four features: many simultaneous readers and one writer at a time, a query language, constraints that reject bad data, and an index so lookups do not scan every row.",
    ),
    list(
      [
        "**Structured** — every value sits in a named column of a typed table, so a program knows what it is reading.",
        "**Shared** — lots of queries come in, and the database decides the order they are applied.",
        "**Durable** — once the database says 'OK', the change survives a crash or a power cut.",
        "**Queryable** — you describe the answer you want, not the code that digs it out.",
      ],
      false,
    ),
    h3("What this course gives you"),
    prose(
      "sparrowsql runs a real SQL engine inside your browser tab (SQLite compiled to WebAssembly). It holds several **virtual databases** at the same time — the college database you practise in, the shop, the library — and each one behaves like its own little server. Everything you read in this book you can run, and everything that runs is exactly what the page says it produced.",
    ),
    example(
      "SHOW DATABASES;",
      "The sandbox answers like a MySQL terminal: one row per database it currently holds. `college_db` is your playground; the other names are the datasets this book opens when a lesson needs them.",
      { support: "mysql", dataset: "college" },
    ),
    dialect(
      "This book teaches the MySQL flavour of SQL, because that is what most tutorials, jobs and textbooks use. The engine underneath is SQLite, so a handful of server-only commands (`GRANT`, triggers, stored procedures, `information_schema`) are explained rather than run, and a few functions are translated for you with a note. Nothing is quietly swapped.",
    ),
    sparrow(
      "When you are lost, come back to one sentence: I am asking a table for rows, and I get back a table. Every statement in this book is that sentence wearing different clothes.",
      "One sentence to hold onto",
    ),
  ],
  quiz: [
    {
      kind: "choice",
      id: "m01-q-why-db",
      prompt: "A school's register lives in a spreadsheet. Which problem is the strongest reason to move it into a database?",
      options: [
        "The file is 3 MB, which is large for a spreadsheet.",
        "Four clerks need to edit it during the same morning without overwriting each other.",
        "The head teacher wants charts on the attendance trend.",
        "The sheet has two tabs.",
      ],
      answerIndex: 1,
      explain:
        "Size and charts are convenience issues. Concurrent, safe writing by several clients is what a database is actually for — that is the 'shared' pillar.",
    },
    {
      kind: "choice",
      id: "m01-q-structured",
      prompt: "'Structured' means the data…",
      options: [
        "is stored in tables where each column has a name and a type.",
        "is stored on a server instead of a laptop.",
        "has been backed up recently.",
        "contains only numbers.",
      ],
      answerIndex: 0,
      explain:
        "Structure is the shape of the data: named, typed columns inside a table. Storage location, backups and data types are separate ideas.",
    },
  ],
  recap: [
    "A database stores data as tables of one kind of thing each.",
    "It earns its place when data is shared, must survive crashes, must obey rules, and must be queried.",
    "sparrowsql runs a real engine in your browser, with several virtual databases.",
  ],
};

const tablesLesson: Lesson = {
  id: "m01-tables-rows-columns",
  chapter: 1,
  order: 2,
  title: "Tables, rows and columns",
  summary:
    "The vocabulary of every database: table, row, column, value, and the primary key that makes a row addressable.",
  minutes: 8,
  difficulty: "foundational",
  prerequisites: ["m01-databases"],
  dataset: "college",
  objectives: [
    "Point at a result table and name its rows, columns and values.",
    "Explain what a primary key guarantees, and what 'unique' and 'not null' add.",
    "Read the schema of an unfamiliar table with DESCRIBE.",
  ],
  blocks: [
    prose(
      "Open the `students` table and you see a grid. The **columns** run down the grid and carry the names of the facts (`id`, `name`, `course`, `city`, `marks`). The **rows** run across it, and each row is one student. The single thing inside one row and one column is a **value**.",
    ),
    table(
      "The students table, all five rows",
      ["id", "name", "course", "city", "marks"],
      [
        [101, "Anjali", "Data Science", "Pune", 88],
        [102, "Rahul", "Data Science", "Mumbai", 74],
        [103, "Priya", "Analytics", "Pune", 92],
        [104, "Vikram", "Analytics", "Delhi", 65],
        [105, "Meera", "Data Science", "Chennai", 79],
      ],
    ),
    diagram(
      "rows-columns",
      "Columns are the questions the table can answer; rows are the answers it holds.",
      [
        { label: "Table students", note: "one kind of thing" },
        { label: "Column name", note: "one fact, same type for every row", tone: "accent" },
        { label: "Row 103", note: "one thing, all of its facts", tone: "accent" },
        { label: "Value 'Analytics'", note: "one cell" },
      ],
    ),
    h3("The primary key"),
    prose(
      "Two students can be called Rahul, and two rows can hold the same mark. Names and values are therefore not enough to say *which row* you mean, so every decent table carries a **primary key**: a column whose value is different in every row and is never missing. Here that is `id`. `101` is Anjali and only Anjali, in this table, forever.",
    ),
    syntax(
      "PRIMARY KEY  →  unique + never null + only one per table",
      "The three promises a primary key makes.",
    ),
    example(
      "SELECT id, name FROM students;",
      "Two columns of the same five rows. Notice `id` is the part you can rely on to be different every time — that is what a key looks like when you read it.",
      {
        dataset: "college",
        expected: {
          columns: ["id", "name"],
          rows: [
            [101, "Anjali"],
            [102, "Rahul"],
            [103, "Priya"],
            [104, "Vikram"],
            [105, "Meera"],
          ],
        },
      },
    ),
    h3("Looking at a table you have never seen"),
    prose(
      "A real job starts with someone else's schema. `DESCRIBE <table>` prints one row per column: its type, whether it accepts NULL, its default, and whether it is a key.",
    ),
    example(
      "DESCRIBE students;",
      "The answer is a table *about* the table. Five columns, `id` marked as the key, the rest as text and integer types.",
      { support: "mysql", dataset: "college" },
    ),
    mistake(
      "Referring to a row by its name: 'update the marks where name = Rahul'.",
      "It runs, and it changes every Rahul in the table.",
      "Names are not keys. Two rows may legitimately share one.",
      "Target rows by primary key: `WHERE id = 102`. If you cannot name one row uniquely, the table needs a key — that is a design problem, and Module 10 covers it.",
    ),
    tip(
      "Read a schema before you read any data. Thirty seconds on `DESCRIBE` prevents an hour of queries against the wrong column.",
      "Habit",
    ),
  ],
  quiz: [
    {
      kind: "choice",
      id: "m01-q-pk",
      prompt: "Which column is the best primary key for a `visits` table recording clinic appointments?",
      options: [
        "patient_name — it identifies the patient.",
        "visited_on — it says when the visit happened.",
        "visit_id — a number assigned to each appointment, one per row.",
        "doctor_name — the appointment belongs to a doctor.",
      ],
      answerIndex: 2,
      explain:
        "A key must describe the row itself and never repeat. Names repeat, dates repeat, and only `visit_id` is guaranteed to pick out exactly one appointment.",
    },
    {
      kind: "fill",
      id: "m01-q-describe",
      prompt: "Print the columns of the products table.",
      before: "DESCRIBE ",
      after: ";",
      accept: ["products", "`products`"],
      explain:
        "`DESCRIBE products;` (or `SHOW COLUMNS FROM products;`) is how you ask a table what it holds.",
    },
  ],
  recap: [
    "Table = one kind of thing. Row = one of them. Column = one fact. Value = one cell.",
    "A primary key is unique, never NULL, and is how you address a single row.",
    "`DESCRIBE t` reads a schema; `SELECT id, name FROM t` reads data.",
  ],
};

const sqlLesson: Lesson = {
  id: "m01-sql-and-verbs",
  chapter: 1,
  order: 3,
  title: "SQL and its five verbs",
  summary:
    "SQL is a declarative language with a handful of verbs. Learn which verb does what and where it sits in a statement.",
  minutes: 9,
  difficulty: "foundational",
  prerequisites: ["m01-tables-rows-columns"],
  dataset: "college",
  objectives: [
    "Match CREATE / INSERT / SELECT / UPDATE / DELETE to the job each one does.",
    "Read a SELECT clause-by-clause in the order SQL actually executes it.",
    "Run a first query and recognise the result as a table.",
  ],
  blocks: [
    prose(
      "**SQL** (*Structured Query Language*) is used to store, manipulate, and retrieve data from a relational database. SQL keywords are **not case-sensitive**: `SELECT` is the same as `select`. We use SQL for **CRUD** operations: **CREATE** (create tables/insert rows), **READ** (retrieve data with queries), **UPDATE** (modify existing records), and **DELETE** (remove data).",
    ),
    table(
      "The Five Main Types of SQL Commands",
      ["Type", "Category", "Key Commands", "Where Mastered"],
      [
        ["DQL", "Data Query Language", "SELECT", "Modules 5, 6, 7, 8, 9"],
        ["DDL", "Data Definition Language", "CREATE, ALTER, DROP, RENAME, TRUNCATE", "Module 2 & Module 4"],
        ["DML", "Data Manipulation Language", "INSERT, UPDATE, DELETE", "Module 4"],
        ["DCL", "Data Control Language", "GRANT, REVOKE", "Module 12"],
        ["TCL", "Transaction Control Language", "COMMIT, ROLLBACK, START TRANSACTION, SAVEPOINT", "Module 12"],
      ],
    ),
    h3("The shape of a SELECT"),
    syntax(
      "SELECT  columns\nFROM    table\nWHERE   row test\nORDER BY columns\nLIMIT   number",
      "The five clauses you will use constantly, in the order you write them.",
    ),
    prose(
      "SQL is *written* in that order but *executed* in a different one, and knowing the execution order explains a lot of confusing errors:",
    ),
    list(
      [
        "`FROM` — which rows are we even talking about?",
        "`WHERE` — throw away the rows that fail the test.",
        "`GROUP BY` / aggregates — collapse the survivors into summary rows.",
        "`SELECT` — only now are the column expressions computed, which is why `WHERE` cannot see an alias you invented here.",
        "`ORDER BY`, then `LIMIT` — sort, then cut.",
      ],
      true,
    ),
    example(
      "SELECT name, marks FROM students WHERE marks >= 80 ORDER BY marks DESC;",
      "Read the output as a table: two columns, and only the students at or above 80, best first. One clause each for 'what', 'from where', 'which ones', 'in what order'.",
      {
        dataset: "college",
        expected: {
          columns: ["name", "marks"],
          ordered: true,
          rows: [
            ["Priya", 92],
            ["Anjali", 88],
          ],
        },
      },
    ),
    sparrow(
      "Run it, then change one thing at a time: drop the WHERE, swap DESC for ASC, add LIMIT 1. SQL is learned by watching results move, not by memorising keywords.",
      "How to read this page",
    ),
    warning(
      "`UPDATE` and `DELETE` without a `WHERE` clause are valid SQL and change *every row*. In this sandbox you can always reset a dataset with the Reset button on the page — on a real server you cannot.",
      "No WHERE, no mercy",
    ),
    keyterms([
      { term: "query", def: "one statement sent to the engine, usually a SELECT." },
      { term: "result set", def: "the table a query hands back: columns and zero or more rows." },
      { term: "clause", def: "one named section of a statement, e.g. the WHERE clause." },
      { term: "DDL / DML", def: "DDL defines structure (CREATE, ALTER); DML changes data (INSERT, UPDATE, DELETE)." },
    ]),
  ],
  quiz: [
    {
      kind: "predict",
      id: "m01-predict-limit",
      prompt: "How many rows does this return?",
      sql: "SELECT name FROM students ORDER BY marks DESC LIMIT 2;",
      dataset: "college",
      options: ["5 rows", "2 rows: Meera, Anjali", "2 rows: Priya, Anjali", "an error, LIMIT needs ORDER BY"],
      answerIndex: 2,
      explain:
        "Sorted by marks descending, the top two are Priya (92) and Anjali (88). LIMIT counts rows, not columns, and needs no ORDER BY.",
    },
    {
      kind: "choice",
      id: "m01-order-exec",
      prompt: "Why does `WHERE alias = 3` fail when `alias` was invented in the SELECT list?",
      options: [
        "Aliases are case-sensitive in SQL.",
        "WHERE runs before SELECT, so the alias does not exist yet.",
        "Only JOINs may use aliases.",
        "It fails because 3 is not a name.",
      ],
      answerIndex: 1,
      explain:
        "Execution order is FROM → WHERE → GROUP BY → SELECT → ORDER BY. The SELECT aliases are produced after WHERE has already filtered.",
    },
    {
      kind: "fill",
      id: "m01-fill-verb",
      prompt: "Which verb adds new rows to a table?",
      before: "",
      after: " INTO students …;",
      accept: ["INSERT"],
      explain: "INSERT adds rows. CREATE makes the table, SELECT reads, UPDATE changes, DELETE removes.",
    },
  ],
  recap: [
    "Five verbs: CREATE, INSERT, SELECT, UPDATE, DELETE.",
    "Written SELECT-first, executed FROM-first — which explains alias and GROUP BY errors.",
    "A query's answer is itself a table you can read and re-query.",
  ],
};

const sandboxLesson: Lesson = {
  id: "m01-inside-sparrowsql",
  chapter: 1,
  order: 4,
  title: "Inside the sparrowsql sandbox",
  summary:
    "Where your queries actually run, what the databases list means, and how the MySQL-to-SQLite translation is announced to you.",
  minutes: 7,
  difficulty: "foundational",
  prerequisites: ["m01-sql-and-verbs"],
  dataset: "college",
  objectives: [
    "Explain what `USE db` changes about the next statement.",
    "Tell the difference between an engine error and an unsupported server command.",
    "Find the notes the compatibility layer attaches to a translated query.",
  ],
  blocks: [
    prose(
      "The sandbox keeps several independent databases in IndexedDB, opens one of them as the **current** database, and sends every statement to the engine with that database in front of it. `USE` picks the current one; `CREATE DATABASE` adds another; nothing crosses the boundary unless a page says it does.",
    ),
    example(
      "USE shop_db;",
      "After this, unqualified table names (`orders`, `products`) resolve inside `shop_db`. Every lesson in this book opens the dataset it needs for you, and labels it on the page.",
      { support: "mysql", dataset: "shop" },
    ),
    diagram(
      "flow",
      "What happens when you press Run.",
      [
        { label: "Your statement", note: "MySQL flavour" },
        { label: "Command router", note: "SHOW / USE / DESCRIBE answered here", tone: "accent" },
        { label: "Dialect layer", note: "rewrites functions, adds a note", tone: "accent" },
        { label: "SQLite (WASM)", note: "the real engine, in a worker" },
        { label: "Result table + notes", note: "printed like a terminal" },
      ],
    ),
    h3("Two kinds of 'no'"),
    list(
      [
        "**A syntax error** — the engine could not parse what you typed. It points at a position, and fixing the spelling fixes the query.",
        "**An unsupported command** — the statement is fine MySQL, but this sandbox has no server to obey it (`GRANT`, `CREATE TRIGGER`, `information_schema`). You get a reason, not a parse failure.",
      ],
      false,
    ),
    example(
      "GRANT SELECT ON college_db.* TO 'intern';",
      "Refused on purpose: a single-user browser sandbox has no roles to grant to. The message says so instead of pretending the permission was applied.",
      { support: "server-only", dataset: "college", expectFailure: true },
    ),
    dialect(
      "When a statement is translated — `NOW()` → `datetime('now')`, `LIMIT 2, 3` → `LIMIT 3 OFFSET 2` — the result panel prints the change underneath the table. Read those notes; they are the difference between learning MySQL and learning a dialect accident.",
    ),
    exercise({
      id: "m01-ex-peek",
      mode: "guided",
      prompt:
        "You are in `college_db`. Write one query that returns only the `name` and `city` columns of every student, and check the row count in the result panel.",
      dataset: "college",
      starter: "SELECT ____ , ____ FROM students;",
      expected: {
        type: "result-set",
        columns: ["name", "city"],
        rows: [
          ["Anjali", "Pune"],
          ["Rahul", "Mumbai"],
          ["Priya", "Pune"],
          ["Vikram", "Delhi"],
          ["Meera", "Chennai"],
        ],
      },
      hints: [
        "List the columns you want, separated by a comma, right after SELECT.",
        "SELECT name, city FROM students;",
      ],
      solution: "SELECT name, city FROM students;",
      success: "Five rows, two columns — you have read a table.",
      xp: 10,
    }),
    tip(
      "The book keeps your reading position, and the Lab keeps your typed query, when you jump between them. Nothing is lost by pressing Run.",
      "Switching pages and editor",
    ),
  ],
  quiz: [
    {
      kind: "choice",
      id: "m01-q-use",
      prompt: "What does `USE shop_db;` do?",
      options: [
        "Copies shop_db into the current database.",
        "Makes shop_db the database that unqualified table names resolve against.",
        "Creates shop_db if it is missing.",
        "Lists the tables of shop_db.",
      ],
      answerIndex: 1,
      explain: "USE switches the session's current database. SHOW TABLES then lists shop_db's tables.",
    },
    {
      kind: "diagnose",
      id: "m01-diag-grant",
      prompt: "Why did this fail?",
      sql: "CREATE TRIGGER no_negative BEFORE UPDATE ON students BEGIN SELECT 1; END;",
      error:
        "CREATE TRIGGER / PROCEDURE / FUNCTION: server-side routines need a daemon that keeps running after your statement finishes.",
      options: [
        "Triggers have a syntax error in SQLite.",
        "The sandbox has no long-running server, so nothing could ever fire the trigger.",
        "Triggers are not allowed on a table with a primary key.",
        "BEGIN is a reserved word.",
      ],
      answerIndex: 1,
      explain:
        "This is an honest limit, reported as one. The statement is refused with a reason rather than mangled into a fake success.",
    },
  ],
  recap: [
    "`USE` chooses the current database; each dataset is isolated from the others.",
    "Errors are either syntax problems or clearly-explained server-only refusals.",
    "Translation notes appear under the result — they are part of the lesson.",
  ],
};

export const moduleOneChapter: Chapter = {
  number: 1,
  id: "module-1",
  title: "Database & SQL Foundations",
  kicker: "Module 1",
  blurb:
    "What a database is, how a table is shaped, the five SQL verbs, and how this sandbox answers you.",
  module: 1,
  kind: "module",
  lessons: [databases, tablesLesson, sqlLesson, sandboxLesson],
  review: [
    {
      kind: "choice",
      id: "m01-r1",
      prompt: "Which sentence best describes a primary key?",
      options: [
        "The column most often used in WHERE clauses.",
        "A column that is unique per row and never NULL.",
        "The first column of a table.",
        "A column that links two tables.",
      ],
      answerIndex: 1,
      explain: "Uniqueness plus NOT NULL is the definition. The linking column is a foreign key.",
    },
    {
      kind: "predict",
      id: "m01-r2",
      prompt: "What is in the first row of this result?",
      sql: "SELECT name FROM students ORDER BY marks LIMIT 1;",
      dataset: "college",
      options: ["Vikram", "Meera", "Priya", "Anjali"],
      answerIndex: 0,
      explain: "ORDER BY marks with no direction is ascending, so the lowest mark (Vikram, 65) comes first.",
    },
    {
      kind: "fill",
      id: "m01-r3",
      prompt: "Complete the statement so it removes only student 104.",
      before: "DELETE FROM students ",
      after: " id = 104;",
      accept: ["WHERE"],
      explain: "Without WHERE, DELETE removes every row in the table.",
    },
  ],
};
