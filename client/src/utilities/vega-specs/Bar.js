import { palette, defaultPrimaryColor, defaultHighlightColor } from '../visualisationColors';

const getLongestLabelLength = (data) => {
  const labels = data[0].values.map(item => item.bucketValue).filter(value => value != null);
  let longestLength = 0;

  labels.forEach((label) => {
    if (label.toString().length > longestLength) longestLength = label.toString().length;
  });

  return longestLength;
};

const getPaddingX = (data, maxLabelLengthX, meanPixelsPerChar, defaultPadding) => {
  const longestLabelLength = getLongestLabelLength(data);
  const charPadding = Math.min(longestLabelLength, maxLabelLengthX);
  const pixPadding = charPadding * meanPixelsPerChar;

  return defaultPadding + pixPadding;
};

/* Calculate how much right-padding we need to add to the chart to allow the last x-axis
** label to render inside the bounds */
const getLabelPadding = (data, meanPixelsPerChar) => {
  const horizontalPixelsPerChar = meanPixelsPerChar / 1.1; // Account for angle
  const lastValue = data[0].values[data[0].values.length - 1] || {};
  const lastLabel = lastValue.bucketValue || '';
  let lastLabelLength = lastLabel.length > 5 ? (lastLabel.length - 5) : 0;
  lastLabelLength = lastLabelLength > 27 ? 27 : lastLabelLength; // Account for truncation
  const labelPadding = Math.floor(lastLabelLength * horizontalPixelsPerChar);

  return labelPadding;
};

const getLegendPadding = (data, spec, meanPixelsPerChar) => {
  /* If there is a custom legend title, make sure we add enough padding for that too */
  const showLegend = spec.subBucketColumn !== null;
  const horizontalPixelsPerChar = meanPixelsPerChar * 1.35;

  if (showLegend) {
    const legendText = spec.legendTitle || '';
    let legendLength = legendText.length > 13 ? legendText.length - 13 : 0;
    legendLength = legendLength > 19 ? 19 : legendLength;

    const legendPadding = Math.floor(legendLength * horizontalPixelsPerChar);

    return legendPadding;
  }

  return 0;
};

export default function getVegaBarSpec(visualisation, data, containerHeight, containerWidth,
  chartSize) {
  const { spec } = visualisation;

  /* Padding calculation constants */
  const maxLabelLengthX = 32; // In chars. Labels longer than this are truncated (...)
  const meanPixelsPerChar = (chartSize === 'small' || chartSize === 'xsmall') ? 3.9 : 4.25;
  const defaultPadding = 40;
  const paddingX = getPaddingX(data, maxLabelLengthX, meanPixelsPerChar, defaultPadding);
  const legendPadding = getLegendPadding(data, visualisation.spec, meanPixelsPerChar);
  const labelPadding = getLabelPadding(data, meanPixelsPerChar);

  const dataSource = 'table';
  const fieldX = 'bucketValue';
  const fieldY = 'y';
  const domainX = data[0].values.map(item => (
    item == null || item.bucketValue == null ? '' : item.bucketValue.toString()
  ));

  if (spec.subBucketColumn !== null && spec.subBucketMethod === 'split') {
    return ({
      data,
      width: containerWidth - (170 + legendPadding),
      height: containerHeight - (26 + paddingX),
      padding: {
        top: 26,
        left: 60,
        bottom: paddingX,
        right: 110 + legendPadding,
      },
      scales: [
        {
          name: 'x',
          type: 'ordinal',
          range: 'width',
          padding: 0.1,
          domain: domainX,
        },
        {
          name: 'y',
          type: 'linear',
          range: 'height',
          domain: {
            data: dataSource,
            field: fieldY,
          },
          nice: true,
        },
        {
          name: 'sgc',
          type: 'ordinal',
          range: palette,
          domain: {
            data: dataSource,
            field: 'subBucketValue',
          },
        },
      ],
      axes: [
        {
          type: 'x',
          scale: 'x',
          title: spec.axisLabelX,
          titleOffset: paddingX - 10,
          tickPadding: 0,
          properties: {
            labels: {
              text: {
                template: `{{datum.data | truncate:${maxLabelLengthX}}}`,
              },
              angle: {
                value: '45',
              },
              dx: {
                value: '5',
              },
              align: {
                value: 'left',
              },
            },
          },
        },
        {
          type: 'y',
          scale: 'y',
          title: spec.axisLabelY,
          formatType: 'number',
          format: 's',
        },
      ],
      legends: [
        {
          fill: 'sgc',
          orient: 'right',
          title: spec.legendTitle ? spec.legendTitle : 'Legend',
          properties: {
            symbols: {
              shape: {
                value: 'square',
              },
            },
          },
        },
      ],
      marks: [
        {
          name: 'bars',
          type: 'group',
          from: {
            data: dataSource,
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: fieldX,
              },
              width: {
                scale: 'x',
                band: true,
                offset: 0,
              },
              fill: {
                value: 'rgba(155, 0, 0, 0.1)',
              },
            },
          },
          scales: [
            {
              name: 'sg',
              type: 'ordinal',
              range: 'width',
              domain: {
                data: dataSource,
                field: 'subBucketValue',
              },
            },
          ],
          marks: [
            {
              name: 'subBuckets',
              type: 'rect',
              properties: {
                enter: {
                  x: {
                    scale: 'sg',
                    field: {
                      parent: 'subBucketValue',
                    },
                  },
                  width: {
                    scale: 'sg',
                    band: true,
                    offset: 0,
                  },
                  y: {
                    scale: 'y',
                    field: {
                      parent: fieldY,
                    },
                  },
                  y2: {
                    scale: 'y',
                    value: 0,
                  },
                },
                update: {
                  fill: {
                    scale: 'sgc',
                    field: {
                      parent: 'subBucketValue',
                    },
                  },
                },
                hover: {
                  fill: {
                    value: defaultHighlightColor,
                  },
                },
              },
            },
            {
              type: 'text',
              properties: {
                enter: {
                  align: {
                    value: 'center',
                  },
                  fill: {
                    value: 'black',
                  },
                },
                update: {
                  x: {
                    scale: 'sg',
                    signal: 'tooltip.subBucketValue',
                  },
                  dx: {
                    scale: 'sg',
                    band: true,
                    mult: 0.5,
                  },
                  y: {
                    scale: 'y',
                    signal: `tooltip.${fieldY}`,
                    offset: -5,
                  },
                  text: {
                    signal: 'tooltipText',
                  },
                  fillOpacity: [
                    {
                      test: 'parent._id == tooltip._id',
                      value: 1,
                    },
                    {
                      value: 0,
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
      signals: [
        {
          name: 'tooltip',
          init: {},
          streams: [
            {
              type: 'rect:mouseover',
              expr: 'parent',
            },
            {
              type: 'rect:mouseout',
              expr: '{}',
            },
          ],
        },
        {
          name: 'tooltipText',
          init: {},
          streams: [
            {
              type: 'rect:mouseover',
              expr: 'floor(parent.y * 1000) / 1000'
              ,
            },
            {
              type: 'rect:mouseout',
              expr: '{}',
            },
          ],
        },
      ],
    });
  }

  if (spec.subBucketColumn !== null && spec.subBucketMethod === 'stack') {
    return ({
      data,
      width: containerWidth - (170 + legendPadding),
      height: containerHeight - (26 + paddingX),
      padding: {
        top: 26,
        left: 60,
        bottom: paddingX,
        right: 110 + legendPadding,
      },
      scales: [
        {
          name: 'x',
          type: 'ordinal',
          range: 'width',
          padding: 0.2,
          domain: domainX,
        },
        {
          name: 'y',
          type: 'linear',
          range: 'height',
          domain: [0, data[0].metadata.max],
          nice: true,
        },
        {
          name: 'sgc',
          type: 'ordinal',
          range: palette,
          domain: {
            data: dataSource,
            field: 'subBucketValue',
          },
        },
      ],
      axes: [
        {
          type: 'x',
          scale: 'x',
          title: spec.axisLabelX,
          titleOffset: paddingX - 10,
          tickPadding: 0,
          properties: {
            labels: {
              text: {
                template: `{{datum.data | truncate:${maxLabelLengthX}}}`,
              },
              angle: {
                value: '45',
              },
              dx: {
                value: '5',
              },
              align: {
                value: 'left',
              },
            },
          },
        },
        {
          type: 'y',
          scale: 'y',
          title: spec.axisLabelY,
          formatType: 'number',
          format: 's',
        },
      ],
      legends: [
        {
          fill: 'sgc',
          orient: 'right',
          title: spec.legendTitle ? spec.legendTitle : 'Legend',
          properties: {
            symbols: {
              shape: {
                value: 'square',
              },
            },
          },
        },
      ],
      marks: [
        {
          name: 'bars',
          type: 'rect',
          from: {
            data: dataSource,
            transform: [
              {
                type: 'stack',
                groupby: 'bucketValue',
                field: fieldY,
                sortby: 'subBucketValue',
              },
            ],
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: 'bucketValue',
              },
              width: {
                scale: 'x',
                band: true,
                offset: -1,
              },
              y: {
                scale: 'y',
                field: 'layout_start',
              },
              y2: {
                scale: 'y',
                field: 'layout_end',
              },
            },
            update: {
              fill: {
                scale: 'sgc',
                field: 'subBucketValue',
              },
            },
            hover: {
              fill: {
                value: defaultHighlightColor,
              },
            },
          },
        },
        {
          type: 'text',
          properties: {
            enter: {
              align: {
                value: 'center',
              },
              fill: {
                value: 'black',
              },
            },
            update: {
              x: {
                scale: 'x',
                signal: `tooltip.${fieldX}`,
              },
              dx: {
                scale: 'x',
                band: true,
                mult: 0.5,
              },
              y: {
                scale: 'y',
                // signal: `tooltip.${layout}`,
                signal: 'tooltip.layout_end',
                offset: 10,
              },
              text: {
                signal: 'tooltipText',
              },
              fillOpacity: [
                {
                  test: '!tooltip._id',
                  value: 0,
                },
                {
                  value: 1,
                },
              ],
            },
          },
        },
      ],
      signals: [
        {
          name: 'tooltip',
          init: {},
          streams: [
            {
              type: 'rect:mouseover',
              expr: 'datum',
            },
            {
              type: 'rect:mouseout',
              expr: '{}',
            },
          ],
        },
        {
          name: 'tooltipText',
          init: {},
          streams: [
            {
              type: 'rect:mouseover',
              expr: 'floor(datum.y * 1000) / 1000',
            },
            {
              type: 'rect:mouseout',
              expr: '{}',
            },
          ],
        },
      ],
    });
  }

  return ({
    data,
    width: containerWidth - (70 + labelPadding),
    height: containerHeight - (26 + paddingX),
    padding: {
      top: 26,
      left: 60,
      bottom: paddingX,
      right: (10 + labelPadding),
    },
    scales: [
      {
        name: 'x',
        type: 'ordinal',
        range: 'width',
        sort: false,
        domain: domainX,
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        domain: {
          data: dataSource,
          field: fieldY,
        },
        nice: true,
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: spec.axisLabelX,
        titleOffset: paddingX - 10,
        tickPadding: 0,
        properties: {
          labels: {
            text: {
              template: `{{datum.data | truncate:${maxLabelLengthX}}}`,
            },
            fontSize: {
              value: (chartSize === 'small' || chartSize === 'xsmall') ? 9 : 11,
            },
            angle: {
              value: '45',
            },
            dx: {
              value: '5',
            },
            align: {
              value: 'left',
            },
          },
        },
      },
      {
        type: 'y',
        scale: 'y',
        title: spec.axisLabelY,
        formatType: 'number',
        format: 's',
      },
    ],
    marks: [
      {
        name: 'bars',
        type: 'rect',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: fieldX,
            },
            width: {
              scale: 'x',
              band: true,
              offset: -1,
            },
            y: {
              scale: 'y',
              field: fieldY,
            },
            y2: {
              scale: 'y',
              value: 0,
            },
          },
          update: {
            fill: {
              value: defaultPrimaryColor,
            },
          },
          hover: {
            fill: {
              value: defaultHighlightColor,
            },
          },
        },
      },
      {
        type: 'text',
        properties: {
          enter: {
            align: {
              value: 'center',
            },
            fill: {
              value: 'black',
            },
          },
          update: {
            x: {
              scale: 'x',
              signal: `tooltip.${fieldX}`,
            },
            dx: {
              scale: 'x',
              band: true,
              mult: 0.5,
            },
            y: {
              scale: 'y',
              signal: `tooltip.${fieldY}`,
              offset: -5,
            },
            text: {
              signal: 'tooltipText',
            },
            fillOpacity: [
              {
                test: '!tooltip._id',
                value: 0,
              },
              {
                value: 1,
              },
            ],
          },
        },
      },
    ],
    signals: [
      {
        name: 'tooltip',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: 'datum',
          },
          {
            type: 'rect:mouseout',
            expr: '{}',
          },
        ],
      },
      {
        name: 'tooltipText',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: 'floor(datum.y * 1000) / 1000',
          },
          {
            type: 'rect:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  });
}
