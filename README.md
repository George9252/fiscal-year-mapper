# fiscal-year-mapper

Converts a calendar date into a fiscal year and quarter, given a configurable fiscal year start month. Pure JavaScript, no dependencies.

```js
import { getFiscalPeriod } from 'fiscal-year-mapper';

// U.S. federal style: fiscal year starts in July, labeled by the year it ends in.
const { fiscalYear, quarter } = getFiscalPeriod(new Date(2024, 8, 15), 7);
// fiscalYear === 2025, quarter === 1
```

Exports:

- `getFiscalPeriod(date, fiscalYearStartMonth)` — returns `{ fiscalYear, quarter, fiscalMonth }`.
- `getFiscalYearStart(date, fiscalYearStartMonth)` — returns the `Date` at local midnight on the first day of the fiscal year containing `date`.
- `validateMonth(month)` — throws `TypeError`/`RangeError` for bad input; used internally.

`fiscalYearStartMonth` is 1-based (1 = January, 7 = July, 12 = December).

## Why

Every business has its own fiscal calendar. Code that hard-codes a July start breaks the moment someone passes in an April-start date. This library takes the start month as a parameter and computes the year and quarter from first principles, so it works for U.S. federal (July), UK (April), calendar-year (January), and any other 12-month arrangement without configuration tables.

## Convention picked

The fiscal year is labeled by the calendar year in which it **ends**. A fiscal year running July 2024–June 2025 is labeled FY 2025. A fiscal year running January–December 2024 is labeled FY 2024. This is the U.S. federal convention and it keeps the label equal to the end year for every start month. If you need the UK/Japan start-year convention, subtract 1 from `fiscalYear`.

## Awkward edge

A January-start fiscal year is the one case where the year starts and ends in the same calendar year. The end-year labeling rule still holds (FY 2024 runs Jan–Dec 2024), but it is the boundary where the general "starts in year N, ends in year N+1" pattern breaks down. The implementation handles this explicitly; if you copy the math into your own code, handle January separately or you will be off by one.

Dates are compared by local calendar components only. Time-of-day is ignored. If you construct a `Date` from a UTC string and your local timezone is behind UTC, the calendar day may shift forward — pass `new Date(year, monthIndex, day)` to avoid ambiguity.
