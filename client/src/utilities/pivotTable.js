import replaceLabelIfValueEmpty from './chart';

const meanPixelsPerChar = 7.5; // Used for calculating min-widths for columns
const defaultCategoryWidth = 100; // Number of pixels to wrap category columns at
const columnLimit = 50; // Don't render a table if there are more columns than this

export { meanPixelsPerChar, defaultCategoryWidth, columnLimit };

export function formatTitle(title) {
  const maxTitleLength = 64;
  if (!title) return title;
  if (title.toString().length <= maxTitleLength) return title;

  return `${title.toString().substring(0, maxTitleLength - 1)}…`;
}

export function getColumnHeaderClassname(cell, index, spec) {
  if (index === 0) {
    if (spec.rowColumn !== null) {
      return 'rowColumnTitle';
    } else if (spec.categoryColumn !== null) {
      return 'spacer';
    }
    return '';
  }
  return 'uniqueColumnValue';
}

export function getColumnHeaderBody(cell, index, spec) {
  if (index > 0) {
    return formatTitle(replaceLabelIfValueEmpty(cell.title));
  }

  return formatTitle(spec.rowTitle ? spec.rowTitle : cell.title);
}

/* Returns the min column width that will limit wrapping to two lines.
/* This is not currently possible with a stylesheet-only approach. */
export function getMinRowTitleWidth(text) {
  return Math.min(
    Math.ceil(((text != null ? text.toString().length : 0) * meanPixelsPerChar) / 2),
    32 * meanPixelsPerChar
  );
}

export function getMinCategoryTitleWidth(text) {
  return Math.min(
    (text != null ? text.toString().length : 0) * meanPixelsPerChar,
    defaultCategoryWidth
  );
}

export function formatCell(index, cell, spec, columns) {
  if (spec.valueDisplay != null && spec.valueDisplay !== 'default') {
    // Cell value has already been formatted, so just display as-is
    return cell;
  }

  const type = columns[index].type;

  if (type === 'number') {
    if (!spec.decimalPlaces) {
      return Math.round(cell);
    }
    // eslint-disable-next-line no-restricted-properties
    return Math.round(cell * Math.pow(10, spec.decimalPlaces)) / Math.pow(10, spec.decimalPlaces);
  }

  return cell;
}
