export default function getVegaPieSpec(visualisation, data, containerHeight, containerWidth) {
  const chartRadius = containerHeight < containerWidth ? containerHeight / 3 : containerWidth / 3;
  const innerRadius = visualisation.visualisationType === 'donut' ?
    Math.floor(chartRadius / 1.75) : 0;

  const hasAggregation = Boolean(visualisation.spec.datasetGroupColumnX &&
    visualisation.spec.aggregationTypeY);
  let dataArray;
  const transformType = hasAggregation ? visualisation.spec.aggregationTypeY : null;

  if (hasAggregation) {
    const transform1 = {
      name: 'summary',
      source: 'table',
      transform: [
        {
          type: 'aggregate',
          groupby: ['aggregationValue'],
          summarize: {
            y: [
              transformType,
            ],
          },
        },
      ],
    };
    const transform2 = {
      name: 'pie',
      source: 'summary',
      transform: [
        {
          type: 'pie',
          field: `${transformType}_y`,
        },
      ],
    };

    dataArray = [data, transform1, transform2];
  } else {
    const pieData = Object.assign({}, data);

    pieData.transform = [{
      type: 'pie',
      field: 'y',
    }];

    dataArray = [pieData];
  }

  const dataSource = hasAggregation ? 'pie' : 'table';
  const segmentLabelField = hasAggregation ? 'aggregationValue' : 'label';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';

  return ({
    data: dataArray,
    width: containerWidth - 20,
    height: containerHeight - 45,
    padding: {
      top: 35,
      right: 10,
      bottom: 10,
      left: 10,
    },
    scales: [
      {
        name: 'r',
        type: 'ordinal',
        domain: {
          data: dataSource,
          field: fieldY,
        },
        range: [chartRadius],
      },
      {
        name: 'c',
        type: 'ordinal',
        range: 'category10',
        domain: {
          data: dataSource,
          field: fieldY,
        },
      },
    ],
    marks: [
      {
        type: 'arc',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              field: {
                group: 'width',
              },
              mult: 0.5,
            },
            y: {
              field: {
                group: 'height',
              },
              mult: 0.5,
            },
            startAngle: {
              field: 'layout_start',
            },
            endAngle: {
              field: 'layout_end',
            },
            innerRadius: {
              value: innerRadius,
            },
            outerRadius: {
              value: chartRadius,
            },
            stroke: {
              value: 'white',
            },
          },
          update: {
            fill: {
              scale: 'c',
              field: fieldY,
            },
          },
          hover: {
            fill: {
              value: 'pink',
            },
          },
        },
      },
      {
        type: 'text',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              field: {
                group: 'width',
              },
              mult: 0.5,
            },
            y: {
              field: {
                group: 'height',
              },
              mult: 0.5,
            },
            radius: {
              scale: 'r',
              field: 'value',
              offset: 30,
            },
            theta: {
              field: 'layout_mid',
            },
            fill: {
              value: 'black',
            },
            align: {
              value: 'center',
            },
            text: {
              field: segmentLabelField,
            },
          },
        },
      },
      {
        type: 'text',
        from: {
          data: dataSource,
          transform: [
            {
              type: 'filter',
              test: 'datum._id == tooltip._id',
            },
          ],
        },
        properties: {
          enter: {
            x: {
              field: {
                group: 'width',
              },
              mult: 0.5,
            },
            y: {
              field: {
                group: 'height',
              },
              mult: 0.5,
            },
            radius: {
              scale: 'r',
              field: 'a',
              offset: -1 * (chartRadius / 5),
            },
            theta: {
              field: 'layout_mid',
            },
            fill: {
              value: 'black',
            },
            align: {
              value: 'center',
            },
            text: {
              field: fieldY,
            },
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
            type: 'arc:mouseover',
            expr: 'datum',
          },
          {
            type: 'arc:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  });
}
