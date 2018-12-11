const visualizationColumnMappings = {
  map: {
    'pivot table': {},
    bar: {},
    line: {},
    area: {},
    pie: {},
    donut: {},
    scatter: {},
    bubble: {},
  },
  'pivot table': {
    map: {},
    bar: {
      valueColumn: 'metricColumnY',
      categoryColumn: 'bucketColumn',
    },
    line: {
      valueColumn: 'metricColumnY',
    },
    area: {
      valueColumn: 'metricColumnY',
    },
    pie: {
      categoryColumn: 'bucketColumn',
    },
    donut: {
      categoryColumn: 'bucketColumn',
    },
    scatter: {
      valueColumn: 'metricColumnY',
      categoryColumn: 'bucketColumnCategory',
    },
    bubble: {
      valueColumn: 'metricColumn',
      categoryColumn: 'bucketColumn',
    },
  },
  bar: {
    map: {},
    'pivot table': {
      metricColumnY: 'valueColumn',
      bucketColumn: 'categoryColumn',
    },
    line: {
      metricColumnY: 'metricColumnY',
    },
    area: {
      metricColumnY: 'metricColumnY',
    },
    pie: {
      bucketColumn: 'bucketColumn',
    },
    donut: {
      bucketColumn: 'bucketColumn',
    },
    scatter: {
      metricColumnY: 'metricColumnY',
      bucketColumn: 'bucketColumnCategory',
    },
    bubble: {
      metricColumnY: 'metricColumn',
      bucketColumn: 'bucketColumn',
    },
  },
  line: {
    map: {},
    'pivot table': {
      metricColumnY: 'valueColumn',
    },
    bar: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
    },
    area: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
    },
    get line() {
      return this.area;
    },
    pie: {},
    donut: {},
    scatter: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
    },
    bubble: {
      metricColumnY: 'metricColumn',
    },
  },
  get area() {
    return this.line;
  },
  pie: {
    map: {},
    'pivot table': {
      bucketColumn: 'categoryColumn',
    },
    bar: {
      bucketColumn: 'bucketColumn',
    },
    line: {},
    area: {},
    donut: {
      bucketColumn: 'bucketColumn',
    },
    get pie() {
      return this.donut;
    },
    scatter: {
      bucketColumn: 'bucketColumnCategory',
    },
    bubble: {
      bucketColumn: 'bucketColumn',
      legendTitle: 'legendTitle',
    },
  },
  get donut() {
    return this.pie;
  },
  scatter: {
    map: {},
    'pivot table': {
      metricColumnY: 'valueColumn',
      bucketColumn: 'categoryColumn',
    },
    bar: {
      metricColumnY: 'metricColumnY',
      bucketColumnCategory: 'bucketColumn',
    },
    line: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
    },
    area: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
    },
    pie: {
      bucketColumnCategory: 'bucketColumn',
    },
    donut: {
      bucketColumnCategory: 'bucketColumn',
    },
    bubble: {
      bucketColumnCategory: 'bucketColumn',
      metricColumnSize: 'metricColumn',
      metricLabel: 'categoryLabel',
      metricLabelFromUser: 'categoryLabelFromuser',
      legendTitle: 'legendTitle',
    },
  },
  bubble: {
    map: {},
    'pivot table': {
      metricColumn: 'valueColumn',
      bucketColumn: 'categoryColumn',
    },
    bar: {
      metricColumn: 'metricColumnY',
      bucketColumn: 'bucketColumn',
    },
    line: {
      metricColumn: 'metricColumnY',
    },
    area: {
      metricColumn: 'metricColumnY',
    },
    pie: {
      bucketColumn: 'bucketColumn',
    },
    donut: {
      bucketColumn: 'bucketColumn',
    },
    scatter: {
      bucketColumn: 'bucketColumnCategory',
      metricColumn: 'metricColumnSize',
      categoryLabel: 'metricLabel',
      categoryLabelFromuser: 'metricLabelFromUser',
      legendTitle: 'legendTitle',
    },
  },
};

export default visualizationColumnMappings;
