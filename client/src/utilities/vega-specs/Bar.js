const getLongestLabelLength = (data) => {
  const labels = data[0].values.map(item => item.bucketValue);
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

export default function getVegaBarSpec(visualisation, data, containerHeight, containerWidth) {
  const dataArray = data.map(item => item);
  const { spec } = visualisation;
  const transformType = spec.metricAggregation;

  /* Padding calculation constants */
  const maxLabelLengthX = 32; // In chars. Labels longer than this are truncated (...)
  const meanPixelsPerChar = 4.75; // Used to calculate padding for labels in pixels
  const defaultPadding = 50;
  const paddingX = getPaddingX(data, maxLabelLengthX, meanPixelsPerChar, defaultPadding);

  const dataSource = 'table';
  const fieldX = 'bucketValue';
  const fieldY = `${transformType}_y`;

  if (spec.subBucketColumn !== null && spec.subBucketMethod === 'split') {
    return ({
      data: dataArray,
      width: containerWidth - 170,
      height: containerHeight - (26 + paddingX),
      padding: {
        top: 26,
        left: 60,
        bottom: paddingX,
        right: 110,
      },
      scales: [
        {
          name: 'x',
          type: 'ordinal',
          range: 'width',
          padding: 0.1,
          domain: {
            data: dataSource,
            field: fieldX,
          },
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
          range: 'category10',
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
          title: 'Legend',
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
                    value: 'rgb(43, 182, 115)',
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
              expr: `floor(parent.${transformType}_y * 1000) / 1000`
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
      data: dataArray,
      width: containerWidth - 170,
      height: containerHeight - (26 + paddingX),
      padding: {
        top: 26,
        left: 60,
        bottom: paddingX,
        right: 110,
      },
      scales: [
        {
          name: 'x',
          type: 'ordinal',
          range: 'width',
          padding: 0.2,
          domain: {
            data: dataSource,
            field: 'bucketValue',
          },
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
          range: 'category10',
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
          title: 'Legend',
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
                value: 'rgb(43, 182, 115)',
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
              expr: `floor(datum.${transformType}_y * 1000) / 1000`,
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
    data: dataArray,
    width: containerWidth - 70,
    height: containerHeight - (26 + paddingX),
    padding: {
      top: 26,
      left: 60,
      bottom: paddingX,
      right: 10,
    },
    scales: [
      {
        name: 'x',
        type: 'ordinal',
        range: 'width',
        domain: {
          data: dataSource,
          field: fieldX,
        },
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
              value: 'rgb(149, 150, 184)',
            },
          },
          hover: {
            fill: {
              value: 'rgb(43, 182, 115)',
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
            expr: `floor(datum.${transformType}_y * 1000) / 1000`,
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
