/**
 * Grading for the book's exercises and for the test harness — one implementation,
 * two callers.
 *
 * The rule that shapes it: judge what the database now holds or what the query
 * returned, never the text the learner typed. Two different queries that produce
 * the same rows are equally right, so the runner interface is the only thing this
 * module needs; the browser passes the real engine and vitest passes a
 * `DatabaseManager`.
 */

import { evaluateDatabaseState, evaluateResultSet, type WrongResultReason } from "../evaluator";
import type { ExerciseExpected, SqlRunResult, TablePreview } from "../types";
import { MAX_RESULT_ROWS, sqlEngine } from "../sqlEngine";
import type { CapstoneMilestone, Exercise, QuizItem } from "./types";

export interface GradeRunner {
  /** Run one script somewhere in the sandbox. */
  run(sql: string): Promise<SqlRunResult>;
  /** Read a table as it stands now, for state-based exercises. */
  snapshot(table: string, database: string): Promise<TablePreview | null>;
}

export interface GradeOutcome {
  correct: boolean;
  result: SqlRunResult;
  /** Why a wrong answer is wrong, in the tutor's vocabulary. */
  reason?: WrongResultReason | "no-table" | "failed";
}

/** The browser's runner: the same engine the Live Lab uses. */
export function engineRunner(): GradeRunner {
  return {
    run: (sql) => sqlEngine.run(sql),
    snapshot: async (table, database) => {
      try {
        return await sqlEngine.preview(table, MAX_RESULT_ROWS, database);
      } catch {
        return null;
      }
    },
  };
}

/**
 * Run `sql` and mark it against `expected`.
 *
 * `result-set` compares the rows the statement returned. `database-state`,
 * `row-count` and `table-exists` re-read the named table after the statement, so
 * an INSERT/UPDATE/DDL task is marked on its effect.
 */
export async function grade(
  runner: GradeRunner,
  sql: string,
  expected: ExerciseExpected,
): Promise<GradeOutcome> {
  const result = await runner.run(sql);
  if (!result.success) return { correct: false, result, reason: "failed" };

  if (expected.type === "result-set") {
    const verdict = evaluateResultSet(result, expected);
    return { correct: verdict.correct, result, reason: verdict.reason };
  }

  const table = expected.tableName ?? "";
  if (!table) {
    return { correct: expected.type === "table-exists" ? false : true, result, reason: "no-table" };
  }

  const preview = await runner.snapshot(table, result.database);
  if (!preview) return { correct: false, result, reason: "no-table" };

  if (expected.type === "table-exists") {
    return { correct: true, result };
  }

  const correct = evaluateDatabaseState(
    { success: true, columns: preview.columns, rows: preview.rows },
    expected,
  );
  return { correct, result, reason: correct ? undefined : "wrong-rows" };
}

/** Convenience wrapper so callers pass an exercise, not its parts. */
export function gradeExerciseSolution(
  runner: GradeRunner,
  exercise: Pick<Exercise, "solution" | "expected">,
): Promise<GradeOutcome> {
  return grade(runner, exercise.solution, exercise.expected);
}

export function gradeMilestone(
  runner: GradeRunner,
  milestone: Pick<CapstoneMilestone, "solution" | "expected">,
): Promise<GradeOutcome> {
  return grade(runner, milestone.solution, milestone.expected);
}

/** The SQL a `predict`/`diagnose` question is about, if it has any. */
export function quizSql(item: QuizItem): string | null {
  if (item.kind === "predict") return item.sql;
  if (item.kind === "diagnose") return item.sql;
  return null;
}

/** Fill-in-the-blank grading: trimmed, case-insensitive, one accepted spelling per idea. */
export function checkFill(item: Extract<QuizItem, { kind: "fill" }>, value: string): boolean {
  const typed = value.trim().replace(/\s+/g, " ").replace(/;+$/, "").toLowerCase();
  if (!typed) return false;
  return item.accept.some((accepted) => {
    const needle = accepted.trim().replace(/\s+/g, " ").replace(/;+$/, "").toLowerCase();
    return needle === typed || needle === `${typed};`;
  });
}

/** Score a quiz: how many items were answered, how many correctly. */
export function scoreQuiz(
  items: QuizItem[],
  answers: Record<string, QuizAnswer>,
): { answered: number; correct: number; total: number } {
  let correct = 0;
  for (const item of items) {
    const answer = answers[item.id];
    if (!answer || answer.value.trim() === "") continue;
    if (item.kind === "fill") {
      if (checkFill(item, answer.value)) correct += 1;
    } else if (Number(answer.value) === item.answerIndex) {
      correct += 1;
    }
  }
  const answered = items.filter((i) => (answers[i.id]?.value ?? "").trim() !== "").length;
  return { answered, correct, total: items.length };
}

export interface QuizAnswer {
  /** Option index for choice/predict/diagnose, typed text for fill. */
  value: string;
  /** True once the learner has been told whether it was right. */
  checked: boolean;
}
