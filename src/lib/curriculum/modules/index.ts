/**
 * The twelve teaching modules, in course order.
 *
 * Each file owns one `Chapter`, so adding a lesson never touches another module and
 * a merge conflict in content stays inside one file.
 */

import { moduleOneChapter } from "./m01";
import { moduleTwoChapter } from "./m02";
import { moduleThreeChapter } from "./m03";
import { moduleFourChapter } from "./m04";
import { moduleFiveChapter } from "./m05";
import { moduleSixChapter } from "./m06";
import { moduleSevenChapter } from "./m07";
import { moduleEightChapter } from "./m08";
import { moduleNineChapter } from "./m09";
import { moduleTenChapter } from "./m10";
import { moduleElevenChapter } from "./m11";
import { moduleTwelveChapter } from "./m12";
import type { Chapter } from "../types";

export const MODULE_CHAPTERS: Chapter[] = [
  moduleOneChapter,
  moduleTwoChapter,
  moduleThreeChapter,
  moduleFourChapter,
  moduleFiveChapter,
  moduleSixChapter,
  moduleSevenChapter,
  moduleEightChapter,
  moduleNineChapter,
  moduleTenChapter,
  moduleElevenChapter,
  moduleTwelveChapter,
];
