const visualizationColumnMappings = {
  map: {
    'pivot table': {},
    bar: {},
    line: {},
    area: {},
    pie: {},
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: {},
    bubble: {},
  },
  'pivot table': {
    map: {},
    bar: {
      valueColumn: 'metricColumnY',
      categoryColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    line: {
      valueColumn: 'metricColumnY',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    area: {
      valueColumn: 'metricColumnY',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    pie: {
      categoryColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: {
      valueColumn: 'metricColumnY',
      categoryColumn: 'bucketColumnCategory',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bubble: {
      valueColumn: 'metricColumn',
      categoryColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
  },
  bar: {
    map: {},
    'pivot table': {
      metricColumnY: 'valueColumn',
      bucketColumn: 'categoryColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    line: {
      metricColumnY: 'metricColumnY',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    area: {
      metricColumnY: 'metricColumnY',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    pie: {
      bucketColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: {
      metricColumnY: 'metricColumnY',
      bucketColumn: 'bucketColumnCategory',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bubble: {
      metricColumnY: 'metricColumn',
      bucketColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
  },
  line: {
    map: {},
    'pivot table': {
      metricColumnY: 'valueColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bar: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    area: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get line() {
      return this.area;
    },
    pie: {
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bubble: {
      metricColumnY: 'metricColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
  },
  get area() {
    return this.line;
  },
  pie: {
    map: {},
    'pivot table': {
      bucketColumn: 'categoryColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bar: {
      bucketColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    line: {
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    area: {
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    pie: {
      bucketColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: {
      bucketColumn: 'bucketColumnCategory',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bubble: {
      bucketColumn: 'bucketColumn',
      legendTitle: 'legendTitle',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
  },
  get donut() {
    return this.pie;
  },
  get polararea() {
    return this.pie;
  },
  scatter: {
    map: {},
    'pivot table': {
      metricColumnY: 'valueColumn',
      bucketColumn: 'categoryColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bar: {
      metricColumnY: 'metricColumnY',
      bucketColumnCategory: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    line: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    area: {
      metricColumnY: 'metricColumnY',
      metricColumnX: 'metricColumnX',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    pie: {
      bucketColumnCategory: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    bubble: {
      bucketColumnCategory: 'bucketColumn',
      metricColumnSize: 'metricColumn',
      metricLabel: 'categoryLabel',
      metricLabelFromUser: 'categoryLabelFromuser',
      legendTitle: 'legendTitle',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
  },
  bubble: {
    map: {},
    'pivot table': {
      metricColumn: 'valueColumn',
      bucketColumn: 'categoryColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    bar: {
      metricColumn: 'metricColumnY',
      bucketColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    line: {
      metricColumn: 'metricColumnY',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    area: {
      metricColumn: 'metricColumnY',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    pie: {
      bucketColumn: 'bucketColumn',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
    get donut() {
      return this.pie;
    },
    get polararea() {
      return this.pie;
    },
    scatter: {
      bucketColumn: 'bucketColumnCategory',
      metricColumn: 'metricColumnSize',
      categoryLabel: 'metricLabel',
      categoryLabelFromuser: 'metricLabelFromUser',
      legendTitle: 'legendTitle',
      showLegend: 'showLegend',
      legendPosition: 'legendPosition',
    },
  },
};

export default visualizationColumnMappings;
