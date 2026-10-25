/**
 * The editor's completion ranking is a pure function, so it is tested directly —
 * the menu that renders it needs no DOM to be wrong in exactly these ways.
 */

import { describe, expect, it } from "vitest";
import { suggestCompletions } from "./SqlEditor";
import type { TableSchema } from "../../lib/types";

function column(name: string, type: string, pk = false) {
  return {
    name,
    type,
    pk,
    notnull: pk,
    nullable: !pk,
    defaultValue: null,
  };
}

const TABLES: TableSchema[] = [
  {
    name: "students",
    columns: [column("id", "INT", true), column("name", "VARCHAR(50)"), column("marks", "INT")],
    rowCount: 5,
  },
  {
    name: "courses",
    columns: [column("id", "INT", true), column("title", "VARCHAR(80)")],
    rowCount: 2,
  },
];

const DATABASES = ["college", "college_db", "ecommerce"];

function labels(items: { label: string }[]): string[] {
  return items.map((i) => i.label);
}

describe("suggestCompletions", () => {
  it("offers nothing before the learner has typed a word", () => {
    expect(suggestCompletions("SELECT * FROM ", TABLES).items).toEqual([]);
  });

  it("narrows a qualified name to that table's columns", () => {
    const after = "SELECT * FROM students WHERE students.";
    const suggestion = suggestCompletions(after, TABLES);
    expect(labels(suggestion.items)).toEqual(["id", "name", "marks"]);
    expect(suggestion.start).toBe(after.length);
  });

  it("filters the qualified list by what has been typed", () => {
    const suggestion = suggestCompletions("SELECT * FROM x WHERE students.nam", TABLES);
    expect(labels(suggestion.items)).toEqual(["name"]);
    // The replacement starts at the fragment after the dot, not at the table.
    expect(suggestion.prefix).toBe("nam");
  });

  it("gives up quietly on a qualified name that is not a table", () => {
    const suggestion = suggestCompletions("SELECT * FROM notes.", TABLES);
    expect(suggestion.items).toEqual([]);
  });

  it("completes table names after FROM, JOIN and UPDATE", () => {
    for (const before of ["SELECT * FROM stu", "SELECT * FROM courses JOIN stu", "UPDATE st"]) {
      const suggestion = suggestCompletions(before, TABLES, DATABASES);
      expect(labels(suggestion.items), before).toContain("students");
      expect(suggestion.items[0]?.kind, before).toBe("table");
    }
  });

  it("completes database names after USE", () => {
    const suggestion = suggestCompletions("USE col", TABLES, DATABASES);
    expect(labels(suggestion.items)).toEqual(["college", "college_db"]);
    expect(suggestion.items[0]?.kind).toBe("database");
  });

  it("prefers columns of the tables already mentioned after WHERE", () => {
    const suggestion = suggestCompletions("SELECT * FROM students WHERE ma", TABLES, DATABASES);
    expect(suggestion.items[0]?.label).toBe("marks");
    expect(suggestion.items[0]?.kind).toBe("column");
  });

  it("completes keywords, not table names, right after SELECT", () => {
    const suggestion = suggestCompletions("SELECT s", TABLES, DATABASES);
    expect(labels(suggestion.items)).not.toContain("students");
    expect(labels(suggestion.items)).toContain("SELECT");
    expect(labels(suggestion.items)).toContain("SET");
  });

  it("completes mid-statement keywords, not only statement starters", () => {
    expect(labels(suggestCompletions("SELECT * FRO", TABLES, DATABASES).items)[0]).toBe("FROM");
    for (const [fragment, word] of [
      ["SELECT * FROM students WH", "WHERE"],
      ["SELECT * FROM students ORDER", "ORDER BY"],
      ["SELECT * FROM students GROUP", "GROUP BY"],
      ["SELECT * FROM students WHERE name LIK", "LIKE"],
    ] as const) {
      expect(labels(suggestCompletions(fragment, TABLES, DATABASES).items)[0], fragment).toBe(word);
    }
  });

  it("ranks prefix matches before words that merely contain the fragment", () => {
    const items = suggestCompletions("SELECT * FROM students WHERE id SEL", TABLES).items;
    expect(items[0]?.label).toBe("SELECT");
  });

  it("caps the menu so it cannot cover the whole editor", () => {
    expect(suggestCompletions("SELECT * FROM students WHERE S", TABLES, DATABASES).items.length)
      .toBeLessThanOrEqual(7);
  });

  it("replaces exactly the fragment in front of the caret", () => {
    const before = "SELECT * FROM stud";
    const suggestion = suggestCompletions(before, TABLES);
    expect(before.slice(suggestion.start)).toBe("stud");
    expect(suggestion.items[0]?.insert).toBe("students");
  });
});
