const visualizationColumnMappings = {
  map: {
    'pivot table': [],
    bar: [],
    line: [],
    area: [],
    pie: [],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: [],
    bubble: [],
  },
  'pivot table': {
    map: [],
    bar: [
      { from: 'valueColumn', to: 'metricColumnY' },
      { from: 'categoryColumn', to: 'bucketColumn' },
    ],
    line: [
      { from: 'valueColumn', to: 'metricColumnY' },
    ],
    area: [
      { from: 'valueColumn', to: 'metricColumnY' },
    ],
    pie: [
      { from: 'categoryColumn', to: 'bucketColumn' },
    ],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: [
      { from: 'valueColumn', to: 'metricColumnY' },
      { from: 'categoryColumn', to: 'bucketColumnCategory' },
    ],
    bubble: [
      { from: 'valueColumn', to: 'metricColumn' },
      { from: 'categoryColumn', to: 'bucketColumn' },
    ],
  },
  bar: {
    map: [],
    'pivot table': [
      { from: 'metricColumnY', to: 'valueColumn' },
      { from: 'bucketColumn', to: 'categoryColumn' },
    ],
    line: [
      { from: 'metricColumnY', to: 'metricColumnY' },
    ],
    area: [
      { from: 'metricColumnY', to: 'metricColumnY' },
    ],
    pie: [
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'bucketColumn', to: 'bucketColumnCategory' },
    ],
    bubble: [
      { from: 'metricColumnY', to: 'metricColumn' },
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
  },
  line: {
    map: [],
    'pivot table': [
      { from: 'metricColumnY', to: 'valueColumn' },
    ],
    bar: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'metricColumnX', to: 'metricColumnX' },
    ],
    area: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'metricColumnX', to: 'metricColumnX' },
    ],
    get line() {
      return this.area;
    },
    pie: [],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'metricColumnX', to: 'metricColumnX' },
    ],
    bubble: [
      { from: 'metricColumnY', to: 'metricColumn' },
    ],
  },
  get area() {
    return this.line;
  },
  pie: {
    map: [],
    'pivot table': [
      { from: 'bucketColumn', to: 'categoryColumn' },
    ],
    bar: [
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
    line: [],
    area: [],
    pie: [
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: [
      { from: 'bucketColumn', to: 'bucketColumnCategory' },
    ],
    bubble: [
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
  },
  get donut() {
    return this.pie;
  },
  get polararea() {
    return this.pie;
  },
  scatter: {
    map: [],
    'pivot table': [
      { from: 'metricColumnY', to: 'valueColumn' },
      { from: 'bucketColumnCategory', to: 'categoryColumn' },
    ],
    bar: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'bucketColumnCategory', to: 'bucketColumn' },
    ],
    line: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'metricColumnX', to: 'metricColumnX' },
    ],
    area: [
      { from: 'metricColumnY', to: 'metricColumnY' },
      { from: 'metricColumnX', to: 'metricColumnX' },
    ],
    pie: [],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    bubble: [
      { from: 'bucketColumnCategory', to: 'bucketColumn' },
      { from: 'metricColumnSize', to: 'metricColumn' },
      { from: 'metricLabel', to: 'categoryLabel' },
      { from: 'metricLabelFromUser', to: 'categoryLabelFromuser' },
      { from: 'legendTitle', to: 'legendTitle' },
    ],
  },
  bubble: {
    map: [],
    'pivot table': [
      { from: 'metricColumn', to: 'valueColumn' },
      { from: 'bucketColumn', to: 'categoryColumn' },
    ],
    bar: [
      { from: 'metricColumn', to: 'metricColumnY' },
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
    line: [
      { from: 'metricColumn', to: 'metricColumnY' },
    ],
    area: [
      { from: 'metricColumn', to: 'metricColumnY' },
    ],
    pie: [
      { from: 'bucketColumn', to: 'bucketColumn' },
    ],
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: [
      { from: 'bucketColumn', to: 'bucketColumnCategory' },
      { from: 'metricColumn', to: 'metricColumnSize' },
      { from: 'categoryLabel', to: 'metricLabel' },
      { from: 'categoryLabelFromuser', to: 'metricLabelFromUser' },
      { from: 'legendTitle', to: 'legendTitle' },
    ],
  },
};

export default visualizationColumnMappings;
