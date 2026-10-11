import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getFiscalPeriod, getFiscalYearStart, validateMonth } from '../src/index.js';

describe('validateMonth', () => {
  it('accepts integers 1 through 12', () => {
    for (const m of [1, 6, 7, 12]) {
      assert.doesNotThrow(() => validateMonth(m));
    }
  });

  it('throws TypeError for non-integers', () => {
    for (const bad of [1.5, '7', null, undefined, NaN, true, {}, []]) {
      assert.throws(() => validateMonth(bad), TypeError);
    }
  });

  it('throws RangeError for out-of-range integers', () => {
    for (const bad of [0, -1, 13, 100]) {
      assert.throws(() => validateMonth(bad), RangeError);
    }
  });
});

describe('getFiscalPeriod — July start (U.S. federal style, end-year label)', () => {
  const fyStart = 7; // July

  it('maps a date in Q1 of a July-start fiscal year to the next calendar year label', () => {
    // July 15, 2024 is in FY 2025 (ends June 2025), Q1, fiscal month 1
    const result = getFiscalPeriod(new Date(2024, 6, 15), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 1, fiscalMonth: 1 });
  });

  it('maps a date in Q4 (June) to the same fiscal year as the preceding July', () => {
    // June 30, 2025 is the last day of FY 2025, Q4, fiscal month 12
    const result = getFiscalPeriod(new Date(2025, 5, 30), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 4, fiscalMonth: 12 });
  });

  it('maps a date before the July start to the prior fiscal year', () => {
    // January 1, 2024 is in FY 2024 (which ran July 2023–June 2024), Q3, fiscal month 7
    const result = getFiscalPeriod(new Date(2024, 0, 1), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2024, quarter: 3, fiscalMonth: 7 });
  });

  it('maps a date in September (Q1) correctly', () => {
    // September 15, 2024 is in FY 2025, Q1, fiscal month 3
    const result = getFiscalPeriod(new Date(2024, 8, 15), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 1, fiscalMonth: 3 });
  });

  it('maps the exact first day of the fiscal year', () => {
    // July 1, 2024 is the first day of FY 2025
    const result = getFiscalPeriod(new Date(2024, 6, 1), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 1, fiscalMonth: 1 });
  });

  it('maps the exact last day of the fiscal year', () => {
    // June 30, 2024 is the last day of FY 2024
    const result = getFiscalPeriod(new Date(2024, 5, 30), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2024, quarter: 4, fiscalMonth: 12 });
  });
});

describe('getFiscalPeriod — January start (calendar year)', () => {
  const fyStart = 1;

  it('labels January–December with the same calendar year', () => {
    const result = getFiscalPeriod(new Date(2024, 0, 1), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2024, quarter: 1, fiscalMonth: 1 });
  });

  it('places March in Q1', () => {
    const result = getFiscalPeriod(new Date(2024, 2, 31), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2024, quarter: 1, fiscalMonth: 3 });
  });

  it('places December 31 in Q4 of the same year', () => {
    const result = getFiscalPeriod(new Date(2024, 11, 31), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2024, quarter: 4, fiscalMonth: 12 });
  });
});

describe('getFiscalPeriod — October start', () => {
  const fyStart = 10; // October

  it('maps October to the next year label, Q1', () => {
    // October 1, 2024 starts FY 2025
    const result = getFiscalPeriod(new Date(2024, 9, 1), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 1, fiscalMonth: 1 });
  });

  it('maps September (before October start) to the prior fiscal year, Q4', () => {
    // September 30, 2024 is the last day of FY 2024 (Oct 2023–Sep 2024)
    const result = getFiscalPeriod(new Date(2024, 8, 30), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2024, quarter: 4, fiscalMonth: 12 });
  });

  it('maps January to Q2 of the fiscal year that started the prior October', () => {
    // January 15, 2025 is in FY 2025 (Oct 2024–Sep 2025), Q2, fiscal month 4
    const result = getFiscalPeriod(new Date(2025, 0, 15), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 2, fiscalMonth: 4 });
  });
});

describe('getFiscalPeriod — April start (UK style)', () => {
  const fyStart = 4;

  it('maps April to the next year label, Q1', () => {
    // April 6, 2024 is in FY 2025 (Apr 2024–Mar 2025 by end-year convention), Q1
    const result = getFiscalPeriod(new Date(2024, 3, 6), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 1, fiscalMonth: 1 });
  });

  it('maps March (before April start) to the prior fiscal year, Q4', () => {
    // March 31, 2025 is the last day of FY 2025 (Apr 2024–Mar 2025), Q4, month 12
    const result = getFiscalPeriod(new Date(2025, 2, 31), fyStart);
    assert.deepStrictEqual(result, { fiscalYear: 2025, quarter: 4, fiscalMonth: 12 });
  });
});

describe('getFiscalPeriod — input validation', () => {
  it('throws TypeError for non-Date input', () => {
    for (const bad of [null, undefined, '2024-01-01', 42, {}, []]) {
      assert.throws(() => getFiscalPeriod(bad, 7), TypeError);
    }
  });

  it('throws for invalid fiscalYearStartMonth', () => {
    assert.throws(() => getFiscalPeriod(new Date(2024, 0, 1), 0), RangeError);
    assert.throws(() => getFiscalPeriod(new Date(2024, 0, 1), 13), RangeError);
    assert.throws(() => getFiscalPeriod(new Date(2024, 0, 1), 1.5), TypeError);
  });
});

describe('getFiscalYearStart', () => {
  it('returns July 1 of the prior calendar year for a January date with July start', () => {
    const start = getFiscalYearStart(new Date(2024, 0, 15), 7);
    assert.deepStrictEqual(start, new Date(2023, 6, 1, 0, 0, 0, 0));
  });

  it('returns July 1 of the same calendar year for a September date with July start', () => {
    const start = getFiscalYearStart(new Date(2024, 8, 15), 7);
    assert.deepStrictEqual(start, new Date(2024, 6, 1, 0, 0, 0, 0));
  });

  it('returns January 1 of the same year for a June date with January start', () => {
    const start = getFiscalYearStart(new Date(2024, 5, 15), 1);
    assert.deepStrictEqual(start, new Date(2024, 0, 1, 0, 0, 0, 0));
  });

  it('throws TypeError for non-Date input', () => {
    assert.throws(() => getFiscalYearStart('not a date', 7), TypeError);
  });
});
