import moment from "moment";
import { round } from "./misc";
import trackEvent from "./trackEvent";

export function formatRange(range: string | number | any[], formatFn: any, unit?: string, unitMany?: string): string | undefined {
  // for convenience
  if (typeof (range) == "number") return formatFn(range as number, unit, unitMany);
  if (typeof (range) == "string") return formatFn(range as string, unit, unitMany);

  // when range has only one value or both range vals same, ex: [1] or [1, 1]
  if (Array.isArray(range) && range.length < 2 || range[0] == range[1]) return formatFn(range[0], unit, unitMany);

  const s0 = formatFn(range[0], unit, unitMany);
  const s1 = formatFn(range[1], unit, unitMany);
  const [v0, unit0] = s0.split(" ");
  const [v1, unit1] = s1.split(" ");
  const unitPlurialRegex = /(\w+)s/;
  const units = [unit0, unit1].map((unit: string) => {
    const match = unit.match(unitPlurialRegex)
    return match && match.length > 0 && match[1] || unit;
  });

  if (units[0] == units[1]) {
    return `${v0}-${v1} ${unit1}`;
  }

  return `${s0}-${s1}`;
}

export function formatTime(v: number | string): string {
  if (typeof (v) == "string") return v;

  if (v >= 1000 * 60 * 60 * 2) return `${round(v / 1000 / 60 / 60)} hours"`;
  if (v == 1000 * 60 * 60) return `${round(v / 1000 / 60 / 600)} hour`;
  if (v >= 1000 * 60 * 2) return `${round(v / 1000 / 60)} minutes`;
  if (v == 1000 * 60) return `${round(v / 1000 / 60)} minute`;
  if (v >= 1000 * 2) return `${round(v / 1000)} seconds`;
  if (v == 1000) return `${round(v / 1000)} second`;

  return `${round(v / 1000)} seconds`
}

export function formatTimeFromNow(v: number): string {
  const now = moment();
  const then = moment(v);
  const seconds = now.diff(then, "seconds");
  // console.log("utils.format.formatTimeFromNow", { seconds });

  return seconds >= 0 && seconds < 40
    ? "just now"
    : seconds < 0 && seconds > -40
      ? "now"
      : moment(v).fromNow();
}

export function formatNumber(v: number | string, unit?: string, unitMany?: string): string {
  const n = Number(v);
  const unitStr = unit
    ? n > 1
      ? (unitMany || ` ${unit}s`)
      : ` ${unit}`
    : "";

  return `${n}${unitStr}`;
}

// adapted from https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function capitalize(s: string) {
  // console.log("utils.misc.capitalize()", { s });
  return s && s
    .split(/\s+/)
    .map((s: string) => s && `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
    .join(" ");
}

export function upperCaseFirstLetter(s: string) {
  // console.log("utils.misc.upperCaseFirstLetter()", { s });
  
  // trying to track down a bug I don't quite undestand
  if (s && typeof (s) != "string") {
    trackEvent("assertion-failed", {
      type: "upperCaseFirstLetter",
      typeof: typeof (s),
      value: JSON.stringify(s)
    });
  }

  if (!s || typeof (s) != "string") return "";
  
  return s.substring(0, 1).toUpperCase() + s.substring(1);
}

export function formatActionInProgress(action: string, negative: boolean = false) {
  // console.log("utils.misc.formatActionInProgress()", { action, negative });
  return `${negative ? "un-" : ""}${action.endsWith("e") ? action.substring(0, action.length - 1) : action}ing`;
}

export function formatPastAction(action: string, negative: boolean = false) {
  // console.log("utils.misc.formatPastAction()", { action, negative });
  return `${negative ? "un-" : ""}${action.endsWith("e") ? action.substring(0, action.length - 1) : action}ed`;
}
