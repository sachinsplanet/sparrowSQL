/**
 * Turning a capstone's data into book lessons.
 *
 * One brief page and one page per milestone, all built the same way so the three
 * projects read as a set. The generator is the only place that knows how a
 * `CapstoneMilestone` becomes blocks, which is why the milestone solutions are also
 * what the verification harness runs.
 */

import type { ExerciseExpected } from "../types";
import {
  example,
  exercise,
  h3,
  keyterms,
  linkTo,
  list,
  prose,
  realWorld,
  sparrow,
  syntax,
  tip,
  warning,
  type Block,
  type Capstone,
  type CapstoneMilestone,
  type DatasetId,
  type Exercise,
  type Lesson,
  type QuizItem,
} from "./types";

/** Which lessons a project expects the learner to have finished first. */
const PREREQUISITES: Record<string, string[]> = {
  "capstone-students": ["m02-create-table", "m02-keys-autoincrement", "m03-foreign-keys"],
  capshop: ["m03-foreign-keys", "m07-group-by", "m08-inner-join"],
  "cap-sales": ["m08-many-to-many", "m09-subquery-scalar", "m11-window-functions"],
};

/** Two mixed questions per project, used as the chapter's review quiz. */
const REVIEWS: Record<string, QuizItem[]> = {
  "capstone-students": [
    {
      kind: "choice",
      id: "cap1-r1",
      prompt: "Why must `courses` and `students` be inserted before `enrollments`?",
      options: [
        "Alphabetical order is the rule.",
        "Each enrollment row carries foreign keys that must already point at real rows.",
        "enrollments is a larger table.",
        "AUTOINCREMENT requires the parent first.",
      ],
      answerIndex: 1,
      explain: "A child row cannot reference a parent that does not exist yet; the engine refuses it.",
    },
    {
      kind: "fill",
      id: "cap1-r2",
      prompt: "Add the rule that a grade must be a percentage.",
      before: "grade INTEGER ",
      after: " (grade BETWEEN 0 AND 100),",
      accept: ["CHECK", "check"],
      explain: "The range belongs in the schema, so every writer obeys it.",
    },
  ],
  capshop: [
    {
      kind: "choice",
      id: "cap2-r1",
      prompt: "Why does `order_items` store `unit_price` as well as `products.price`?",
      options: [
        "To make the table wider.",
        "Because a past sale must keep the price charged then, even after the catalogue price changes.",
        "Because a join cannot fetch the price.",
        "It is a foreign key.",
      ],
      answerIndex: 1,
      explain:
        "History lives on the line. Reading today's catalogue price would silently rewrite last month's revenue.",
    },
    {
      kind: "diagnose",
      id: "cap2-r2",
      prompt: "Revenue came out far too large. Which is the most likely cause?",
      sql: "SELECT SUM(o.id * oi.quantity) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id;",
      error: "No error at all: it returns 1234, and every manager who reads it is being told the wrong number.",
      options: [
        "SUM cannot multiply.",
        "The join produced one row per order line, so any per-order figure was counted once per line.",
        "orders has no primary key.",
        "Cancelled orders were excluded.",
      ],
      answerIndex: 1,
      explain:
        "Joining to a child table repeats the parent on every line. Aggregate the child, or group by the parent first.",
    },
  ],
  "cap-sales": [
    {
      kind: "choice",
      id: "cap3-r1",
      prompt: "What is the job of the CTE in the 'top of each region' report?",
      options: [
        "It makes the query run faster.",
        "It produces one row per salesperson, so the window ranks people rather than deals.",
        "It replaces the JOIN.",
        "It filters out small deals.",
      ],
      answerIndex: 1,
      explain:
        "RANK() OVER (PARTITION BY region_id) is applied to whatever the input rows are; they must already be one per person.",
    },
    {
      kind: "predict",
      id: "cap3-r2",
      prompt: "The last running_total in the monthly report equals…",
      sql: "SELECT SUM(amount) AS all_deals FROM deals;",
      dataset: "sales",
      options: ["The largest single month", "132200, the whole half-year", "19500", "Six times the average month"],
      answerIndex: 1,
      explain:
        "A cumulative sum finishes at the grand total — which is exactly how you prove the window function was right.",
    },
  ],
};

/** Idempotent statements a milestone needs before the learner starts typing. */
function prepareFor(capstone: Capstone, milestone: CapstoneMilestone): string | undefined {
  if (!milestone.prepare) return undefined;
  const looksLikeSql = /^(create|insert|with|select|update|delete|alter|drop|delete)\b/i.test(
    capstone.starterData.trimStart(),
  );
  const parts: string[] = [];
  if (milestone.prepare === "schema" || milestone.prepare === "both") parts.push(capstone.schema);
  if (milestone.prepare === "data" || milestone.prepare === "both") {
    if (looksLikeSql) parts.push(capstone.starterData);
  }
  return parts.filter(Boolean).join("\n\n") || undefined;
}

function toExercise(capstone: Capstone, milestone: CapstoneMilestone): Exercise {
  return {
    id: milestone.id,
    mode: "guided",
    prompt: milestone.requirement,
    dataset: milestone.dataset,
    setup: prepareFor(capstone, milestone),
    expected: milestone.expected,
    hints: milestone.hints,
    solution: milestone.solution,
    success: milestone.successCriteria,
    xp: 40,
    extend: milestone.extend,
  };
}

/** Does the milestone's answer print a table? Then the worked example can claim it. */
function resultExpected(expected: ExerciseExpected) {
  if (expected.type !== "result-set" || !expected.columns) return undefined;
  return { columns: expected.columns, rows: expected.rows ?? [], ordered: expected.ordered };
}

function milestoneLesson(
  capstone: Capstone,
  milestone: CapstoneMilestone,
  index: number,
): Lesson {
  const blocks: Block[] = [
    prose(milestone.requirement),
    tip(milestone.successCriteria, "How you will know it is right"),
    h3("Your turn"),
    exercise(toExercise(capstone, milestone)),
    h3("Worked solution"),
    example(
      milestone.solution,
      "This is the reference answer, run exactly as you would run it. Reading it after your own attempt is worth more than reading it before.",
      {
        dataset: milestone.dataset,
        setup: prepareFor(capstone, milestone),
        expected: resultExpected(milestone.expected),
      },
    ),
    sparrow(
      milestone.hints[0] ??
        "If the check fails, run the statement on its own first: a wrong result and an error are different problems.",
      "Sparrow's nudge",
    ),
  ];
  if (index === 0) {
    blocks.push(
      warning(
        "Build in order. A child row that points at a table you have not created yet is refused, and the message will not look like a schema problem.",
        "Start with the parents",
      ),
    );
  }
  if (milestone.extend) {
    blocks.push(prose(`**Stretch:** ${milestone.extend.prompt}`));
  }
  if (index + 1 < capstone.milestones.length) {
    blocks.push(
      linkTo(
        `${capstone.id}-m${index + 2}`,
        `Next: ${capstone.milestones[index + 1].title}`,
      ),
    );
  }
  return {
    id: `${capstone.id}-m${index + 1}`,
    chapter: 0,
    order: 0,
    title: milestone.title,
    summary: milestone.requirement,
    minutes: Math.max(8, Math.round(capstone.minutes / capstone.milestones.length)),
    difficulty: "project",
    prerequisites: index === 0 ? [`${capstone.id}-brief`] : [`${capstone.id}-m${index}`],
    dataset: milestone.dataset,
    objectives: [milestone.title, milestone.successCriteria, ...capstone.skills.slice(0, 1)],
    blocks,
    quiz: [],
    recap: [milestone.successCriteria, capstone.skills[index % capstone.skills.length]],
  };
}

function briefLesson(capstone: Capstone): Lesson {
  const peek = PEEKS[capstone.id];
  const blocks: Block[] = [
    prose(capstone.problem),
    h3("The brief, item by item"),
    list(capstone.brief),
    h3("Shape of the data"),
    syntax(capstone.schema, "The structure this project is asking for."),
  ];
  if (peek) {
    blocks.push(
      example(
        peek.sql,
        peek.explain,
        { dataset: capstone.dataset, setup: peek.setup, expected: peek.expected, expectFailure: peek.expectFailure },
      ),
    );
  }
  blocks.push(
    h3("Skills you will practise"),
    list(capstone.skills),
    h3("The milestones, in order"),
    list(capstone.milestones.map((m, i) => `**${i + 1}. ${m.title}** — ${m.requirement}`), true),
    realWorld(
      "This is the shape of a real ticket: a short paragraph of requirements, a schema nobody has drawn yet, and a report somebody is waiting for. Read the brief twice and write the table names in the margin before you type any SQL.",
    ),
    sparrow(
      "Do the milestones in order, and keep this page open. Every one of them is checkable, so you always know whether you are on track.",
      "How to work through a project",
    ),
    keyterms([
      { term: "brief", def: "the written requirements a database has to satisfy." },
      { term: "milestone", def: "one independently checkable step of a project." },
    ]),
  );
  return {
    id: `${capstone.id}-brief`,
    chapter: 0,
    order: 0,
    title: `${capstone.title}: the brief`,
    summary: capstone.problem,
    minutes: 8,
    difficulty: "project",
    prerequisites: PREREQUISITES[capstone.id] ?? [],
    dataset: capstone.dataset,
    objectives: [
      "Turn a written requirement into tables, columns and constraints",
      capstone.skills[0],
      "Know what 'finished' means before you start",
    ],
    blocks,
    quiz: [],
    recap: capstone.skills.slice(0, 3),
  };
}

/**
 * One runnable look at the data each project works with, so the brief page proves
 * the tables exist instead of describing them.
 */
const PEEKS: Record<
  string,
  {
    sql: string;
    explain: string;
    dataset: DatasetId;
    setup?: string;
    /** The lesson's point is the error this statement produces. */
    expectFailure?: boolean;
    expected?: { columns: string[]; rows: unknown[][]; ordered?: boolean };
  }
> = {
  "capstone-students": {
    sql: "SELECT COUNT(*) AS courses FROM courses;",
    explain:
      "Run it and the sandbox answers 'no such table: courses'. That is the honest starting line of this project: `practice_db` holds only `scratchpad`, and milestone 1 creates the three tables the rest of the queries will read.",
    dataset: "practice",
    expectFailure: true,
  },
  capshop: {
    sql: "SELECT id, title, price, stock FROM products ORDER BY id LIMIT 3;",
    explain:
      "The catalogue you will report on. Three of six products are enough to see the shape; the milestone queries use all of them.",
    dataset: "shop",
    expected: {
      columns: ["id", "title", "price", "stock"],
      ordered: true,
      rows: [
        [1, "Keyboard", 1499, 12],
        [2, "Mouse", 699, 30],
        [3, "Desk Lamp", 899.5, 7],
      ],
    },
  },
  "cap-sales": {
    sql: "SELECT COUNT(*) AS deals, SUM(amount) AS total FROM deals;",
    explain:
      "Twelve closed deals worth 132200. Keep that number: your final report must add up to exactly it.",
    dataset: "sales",
    expected: { columns: ["deals", "total"], rows: [[12, 132200]] },
  },
};

export const capstoneMilestoneLessonShape = {
  brief: (capstone: Capstone): Lesson => briefLesson(capstone),
  milestone: (capstone: Capstone, milestone: CapstoneMilestone, index: number): Lesson =>
    milestoneLesson(capstone, milestone, index),
  review: (capstone: Capstone): QuizItem[] => REVIEWS[capstone.id] ?? [],
};
