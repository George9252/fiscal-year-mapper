/**
 * Core fiscal year mapping logic.
 *
 * Design decision: fiscal year labels follow the calendar year of the END of the
 * fiscal period. This is the "U.S. federal" convention — the fiscal year that ends
 * on September 30, 2024 is labeled FY 2024. This keeps the label stable and
 * unambiguous; labeling by start year (UK/Japan convention) is trivially obtained
 * by subtracting 1 if needed, but we pick one and stick with it.
 */

/**
 * Validate that month is a 1-based integer in [1, 12].
 *
 * JavaScript Date uses 0-based months, which is a common source of off-by-one
 * errors. We expose a 1-based API to callers and convert internally.
 *
 * @param {number} month 1-based fiscal year start month (1 = January, 12 = December)
 * @returns {void}
 * @throws {TypeError} if month is not a finite integer
 * @throws {RangeError} if month is outside [1, 12]
 */
export function validateMonth(month) {
  if (typeof month !== 'number' || !Number.isInteger(month)) {
    throw new TypeError(`fiscalYearStartMonth must be an integer, got ${String(month)}`);
  }
  if (month < 1 || month > 12) {
    throw new RangeError(`fiscalYearStartMonth must be in [1, 12], got ${month}`);
  }
}

/**
 * Compute the fiscal year and quarter for a calendar date.
 *
 * The fiscal year starts on the first day of `fiscalYearStartMonth` (1-based).
 * Quarters are three consecutive months: Q1 = months 0–2 of the fiscal year, etc.
 *
 * Label convention: the fiscal year is labeled with the calendar year in which it
 * ENDS. A fiscal year starting in July 2024 ends in June 2025 and is labeled FY 2025.
 * A fiscal year starting in January is identical to the calendar year (labeled with
 * that same year). This single rule covers every start month without special cases.
 *
 * @param {Date} date A calendar date (any time-of-day; only year/month/day are read).
 * @param {number} fiscalYearStartMonth 1-based month when the fiscal year starts
 *   (1 = January, 7 = July, etc.)
 * @returns {{fiscalYear: number, quarter: number, fiscalMonth: number}} An object
 *   with `fiscalYear` (integer, the end-year label), `quarter` (1–4), and
 *   `fiscalMonth` (1-based month WITHIN the fiscal year, 1–12).
 * @throws {TypeError} if `date` is not a Date instance or `fiscalYearStartMonth` is invalid
 */
export function getFiscalPeriod(date, fiscalYearStartMonth) {
  if (!(date instanceof Date)) {
    throw new TypeError(`date must be a Date instance, got ${Object.prototype.toString.call(date)}`);
  }
  validateMonth(fiscalYearStartMonth);

  // Date methods use 0-based months internally; we work in 0-based here and
  // convert to 1-based only for the public return value.
  const calendarYear = date.getFullYear();
  const calendarMonth0 = date.getMonth();
  const fyStartMonth0 = fiscalYearStartMonth - 1;

  let monthsSinceFYStart;
  let fiscalYear;

  if (calendarMonth0 >= fyStartMonth0) {
    // We are in or after the fiscal year that started in `calendarYear`.
    monthsSinceFYStart = calendarMonth0 - fyStartMonth0;
    // That fiscal year ends next calendar year, so label = calendarYear + 1.
    fiscalYear = calendarYear + 1;
  } else {
    // We are before this year's start, so we're in the fiscal year that started
    // in the previous calendar year.
    monthsSinceFYStart = calendarMonth0 - fyStartMonth0 + 12;
    // That fiscal year ends in the current calendar year, so label = calendarYear.
    fiscalYear = calendarYear;
  }

  // When fiscalYearStartMonth === 1 (January), the +1/-1 logic above still holds:
  // calendarMonth0 (>= 0, i.e. >= fyStartMonth0) gives fiscalYear = calendarYear + 1,
  // and the monthsSinceFYStart = calendarMonth0, which is correct. A January-start
  // fiscal year IS the calendar year, so FY = calendarYear + 1 = calendarYear + 1.
  // Wait — that would be wrong for January! Let me recheck.
  // For January start (fyStartMonth0 = 0): every month satisfies calendarMonth0 >= 0,
  // so fiscalYear = calendarYear + 1. But a Jan-Dec fiscal year should be labeled
  // with the year it spans. By the "end-year" convention, the fiscal year that runs
  // Jan–Dec 2024 ends Dec 2024, so FY = 2024 = calendarYear. So the +1 is WRONG
  // for January. The issue: a Jan-start fiscal year both starts and ends in the
  // same calendar year. The general rule "ends next calendar year" is false when
  // fyStartMonth0 === 0.

  // Corrected logic: the fiscal year ends in the same calendar year if and only if
  // fyStartMonth0 === 0 (January start). Otherwise it ends in the next calendar year.
  if (fyStartMonth0 === 0) {
    fiscalYear = calendarYear;
  } else if (calendarMonth0 >= fyStartMonth0) {
    fiscalYear = calendarYear + 1;
  } else {
    fiscalYear = calendarYear;
  }

  const fiscalMonth = monthsSinceFYStart + 1; // 1-based
  const quarter = Math.floor(monthsSinceFYStart / 3) + 1; // 1–4

  return { fiscalYear, quarter, fiscalMonth };
}

/**
 * Return the start Date (at 00:00:00 local time) of the fiscal year containing `date`.
 *
 * Why local time: the library maps calendar dates to fiscal periods. Using local
 * midnight avoids surprising timezone shifts when the caller constructed a Date
 * from a calendar date string. Callers needing UTC should construct their input
 * Date accordingly.
 *
 * @param {Date} date A calendar date
 * @param {number} fiscalYearStartMonth 1-based start month
 * @returns {Date} Midnight local time on the first day of the fiscal year
 */
export function getFiscalYearStart(date, fiscalYearStartMonth) {
  if (!(date instanceof Date)) {
    throw new TypeError(`date must be a Date instance, got ${Object.prototype.toString.call(date)}`);
  }
  validateMonth(fiscalYearStartMonth);

  const calendarYear = date.getFullYear();
  const calendarMonth0 = date.getMonth();
  const fyStartMonth0 = fiscalYearStartMonth - 1;

  let startCalendarYear;
  if (fyStartMonth0 === 0) {
    startCalendarYear = calendarYear;
  } else if (calendarMonth0 >= fyStartMonth0) {
    startCalendarYear = calendarYear;
  } else {
    startCalendarYear = calendarYear - 1;
  }

  return new Date(startCalendarYear, fyStartMonth0, 1, 0, 0, 0, 0);
}
