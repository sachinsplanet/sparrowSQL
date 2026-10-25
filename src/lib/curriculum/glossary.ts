/**
 * The book's glossary seed.
 *
 * Every lesson's `keyterms` block is folded into this list by `index.ts`, so the
 * curated set below only needs the vocabulary that appears in prose without a key
 * term card: the words a learner will type into a search box.
 */

export interface GlossaryEntry {
  term: string;
  def: string;
  /** Lesson ids that teach it, filled in by the registry. */
  lessons?: string[];
}

export const GLOSSARY_SEED: GlossaryEntry[] = [
  { term: "aggregate function", def: "A function that collapses many rows into one value: COUNT, SUM, AVG, MIN, MAX." },
  { term: "alias", def: "A short name given to a column or a table with AS, used to keep queries readable." },
  { term: "AUTOINCREMENT", def: "A counter the engine owns: each new row gets the next number in the key column." },
  { term: "BETWEEN", def: "An inclusive range test in WHERE, e.g. marks BETWEEN 70 AND 90." },
  { term: "cascade", def: "An ON DELETE / ON UPDATE rule that carries a change through to the child rows." },
  { term: "CHECK constraint", def: "A boolean rule attached to a column or table that every write must satisfy." },
  { term: "collation", def: "The rules that decide how strings compare and sort, including case and accents." },
  { term: "column", def: "One named, typed fact of a table; it holds a value for every row." },
  { term: "composite key", def: "A primary or unique key made of more than one column, e.g. (post_id, tag_id)." },
  { term: "constraint", def: "A rule the database enforces for you: PRIMARY KEY, NOT NULL, UNIQUE, CHECK, FOREIGN KEY." },
  { term: "correlated subquery", def: "An inner query that refers to the outer query's row, so it runs per candidate row." },
  { term: "CTE", def: "Common Table Expression: a named temporary result written with WITH, readable one step at a time." },
  { term: "DCL", def: "Data control language: GRANT and REVOKE, which manage permissions on a server." },
  { term: "DATETIME", def: "A date and a clock time together, written 'YYYY-MM-DD HH:MM:SS'." },
  { term: "DDL", def: "Data definition language: CREATE, ALTER and DROP, which change structure." },
  { term: "DECIMAL", def: "An exact numeric type written as DECIMAL(precision, scale); the correct choice for money." },
  { term: "DELETE", def: "The verb that removes rows; without WHERE it removes all of them." },
  { term: "DISTINCT", def: "A keyword that removes duplicate rows from a result, or duplicates inside an aggregate." },
  { term: "DML", def: "Data manipulation language: INSERT, UPDATE, DELETE, SELECT." },
  { term: "EXISTS", def: "A test on a subquery: true when the inner query returns at least one row." },
  { term: "foreign key", def: "A column whose value must exist as a key in another table; it makes a relationship enforceable." },
  { term: "GROUP BY", def: "The clause that splits rows into buckets so aggregates are computed per bucket." },
  { term: "HAVING", def: "A filter applied after GROUP BY, on the aggregate rather than on a single row." },
  { term: "index", def: "A sorted structure that lets the engine find rows by a column without scanning the table." },
  { term: "INNER JOIN", def: "Matches rows from two tables on a condition and returns only the pairs that match." },
  { term: "INSERT", def: "The verb that adds rows; a column list plus one or more VALUES lists." },
  { term: "IS NULL", def: "The only correct test for a missing value; = NULL never matches anything." },
  { term: "JOIN", def: "Combining rows from two tables on a condition; the heart of relational queries." },
  { term: "LIKE", def: "Pattern matching on text with % (any run of characters) and _ (exactly one character)." },
  { term: "many-to-many", def: "A relationship where each row on both sides can relate to many of the other; needs a junction table." },
  { term: "normalisation", def: "Splitting data into tables so each fact is stored once, without losing the ability to query it." },
  { term: "NULL", def: "The absence of a value: unknown or not applicable. It is not zero and not an empty string." },
  { term: "ON DELETE", def: "What happens to child rows when their parent is deleted: RESTRICT, CASCADE or SET NULL." },
  { term: "orphan", def: "A child row whose parent no longer exists — the state a foreign key prevents." },
  { term: "primary key", def: "The column (or columns) that identifies each row: unique and never NULL." },
  { term: "projection", def: "Choosing which columns a query returns." },
  { term: "query plan", def: "The engine's chosen steps for answering a statement; EXPLAIN prints it." },
  { term: "referential integrity", def: "The guarantee that every pointer to another table points at something that exists." },
  { term: "result set", def: "The table a query returns: named columns and zero or more rows." },
  { term: "row", def: "One record in a table: all of that thing's column values together." },
  { term: "schema", def: "The structure of a database — its tables, columns, types and constraints." },
  { term: "self join", def: "A table joined to itself under two aliases, to compare rows of the same kind." },
  { term: "subquery", def: "A query used inside another query, in WHERE, SELECT or FROM." },
  { term: "surrogate key", def: "An artificial id with no real-world meaning, used because it never changes." },
  { term: "table", def: "A set of rows, all holding the same columns; one kind of thing." },
  { term: "transaction", def: "A group of statements that either all take effect or none do." },
  { term: "UNION", def: "Stacks the results of two queries into one, removing duplicates; UNION ALL keeps them." },
  { term: "unique constraint", def: "A rule that no two rows may share a value in the named column(s)." },
  { term: "UPDATE", def: "The verb that changes values in existing rows; WHERE decides which rows." },
  { term: "view", def: "A stored query that can be read like a table, used to hide complexity or restrict columns." },
  { term: "window function", def: "An aggregate computed across related rows without collapsing them, written with OVER." },
];
