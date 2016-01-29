export function parse(source, { separator, isFirstRowHeader }) {
  let rows = source.split('\n').map((row) => row.split(separator).map((cell) => cell.trim()));
  const header = isFirstRowHeader ? rows[0] : rows[0].map((_, idx) => `Column ${idx + 1}`);
  rows = isFirstRowHeader ? rows.splice(1) : rows;
  return header.map((title, idx) => ({
    title,
    type: 'STRING',
    values: rows.map(row => row[idx]),
  }));
}
