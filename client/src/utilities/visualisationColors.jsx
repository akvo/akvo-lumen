export const patterns = [
  { type: 'Lines', strokeWidth: 10, size: 10, orientation: 'diagonal' },
  { type: 'Circles', strokeWidth: 3, size: 10 },
  { type: 'Paths', d: 'squares', size: 14, fill: '#4293B6' },
  { type: 'Paths', d: 'nylon', size: 14 },
  { type: 'Paths', d: 'waves', size: 14 },
  { type: 'Paths', d: 'woven', size: 14 },
  { type: 'Paths', d: 'caps', size: 14 },
  { type: 'Paths', d: 'crosses', size: 14 },
  { type: 'Paths', d: 'hexagons', size: 14 },
];
export const patternsCount = patterns.length;

export const palette = [
  '#BF2932',
  '#19A99D',
  '#95734B',
  '#86AA90',
  '#66608F',
  '#FEDA77',
  '#C0652A',
  '#5286B4',
  '#C28A6F',
  '#61B66F',
  '#3D3455',
  '#D8BB7F',
  '#158EAE',
  '#5F6253',
  '#921FA1',
  '#F38341',
  '#487081',
  '#556123',
  '#C799AE',
  '#2F4E77',
  '#B8385E',
  '#9E4962',
];

/*
export const palette = [
  '#4293B6',
  '#E17338',
  '#1B3B53',
  '#E3AC50',
  '#6EA594',
  '#CA5730',
  '#357796',
  '#E28F43',
  '#285A75',
  '#B13B29',
  '#AAB876',
];
*/

export const paletteCount = palette.length;

export const paletteWithPatterns = palette.slice();

for (let i = 0; i < patternsCount; i++) {
  for (let j = 0; j < paletteCount; j++) {
    paletteWithPatterns.push({ ...patterns[i], stroke: palette[j] });
  }
}

export const defaultPrimaryColor = '#5286B4';
export const defaultHighlightColor = '#61B66F';

export const randomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// keeping this here because it might come in useful if we want to do pattern fills etc

// export const getFills = (keys, descriptors) => keys.reduce((acc, key, i) => {
//   const descriptor = descriptors[key] || paletteWithPatterns[i];
//   if (isObject(descriptor)) {
//     const { type, ...rest } = descriptor;
//     const the = { component: Pattern[type] };
//     const id = `p-${Math.random() * 100}`;
//     return { ...acc, [key]: { id, element: <the.component {...rest} id={id} />, descriptor } };
//   }
//   return { ...acc, [key]: descriptor };
// }, {});

// export const getFillDefs = descriptors => Object.keys(descriptors).reduce((acc, key) => {
//   const descriptor = descriptors[key];
//   if (isObject(descriptor)) return acc.concat(descriptor.element);
//   return acc;
// }, []);

// export const getFill = (descriptor) => {
//   if (isObject(descriptor)) return `url(#${descriptor.id})`;
//   return descriptor;
// };

// export const getStroke = (descriptor) => {
//   if (isObject(descriptor)) return descriptor.descriptor.stroke;
//   return descriptor;
// };

// keeping this in case we want to swithc back to old colours