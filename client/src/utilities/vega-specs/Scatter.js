export default function getVegaScatterSpec(visualisation, data, containerHeight, containerWidth) {
  const hasAggregation = visualisation.spec.bucketColumn !== null;
  const dataSource = 'table';
  const { metadata } = data[0];
  const fieldX = 'x';
  const fieldY = 'y';

  const scales = [
    {
      name: 'xscale',
      type: 'linear',
      domain: {
        data: dataSource,
        field: fieldX,
      },
      range: 'width',
      zero: false,
      nice: false,
    },
    {
      name: 'yscale',
      type: 'linear',
      domain: {
        data: dataSource,
        field: fieldY,
      },
      range: 'height',
      nice: true,
    },
  ];

  const xAxis = {
    type: 'x',
    scale: 'xscale',
    orient: 'bottom',
    title: visualisation.spec.axisLabelX,
  };

  if (metadata.xAxisType === 'date') {
    xAxis.properties = {
      labels: {
        text: {
          template: '{{ datum.data | time:"%Y-%b-%d %H-%M"}}',
        },
        angle: {
          value: 35,
        },
        align: {
          value: 'left',
        },
      },
    };
  }

  const yAxis = {
    type: 'y',
    scale: 'yscale',
    orient: 'left',
    title: visualisation.spec.axisLabelY,
  };

  if (metadata.yAxisType === 'date') {
    yAxis.properties = {
      labels: {
        text: {
          template: '{{ datum.data | time:"%Y-%b-%d %H-%M"}}',
        },
        align: {
          value: 'right',
        },
      },
    };
  }

  return ({
    data,
    width: containerWidth - 90,
    height: containerHeight - 100,
    padding: {
      top: 30,
      left: 60,
      bottom: 70,
      right: 30,
    },
    scales,
    axes: [
      xAxis,
      yAxis,
    ],
    marks: [
      {
        type: 'symbol',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              field: fieldX,
              scale: 'xscale',
            },
            y: {
              field: fieldY,
              scale: 'yscale',
            },
            size: { value: 50 },
            opacity: { value: 0.8 },
          },
          update: {
            fill: { value: 'rgb(149, 150, 184)' },
            opacity: [
              {
                test: 'hover._id && hover._id !== datum._id',
                value: visualisation.spec.datapointLabelColumn === null ? 0.8 : 0.4,
              },
              {
                value: 0.8,
              },
            ],
          },
          hover: {
            fill: { value: 'rgb(43, 182, 115)' },
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
              test: 'datum._id == hover._id',
            },
          ],
        },
        properties: {
          update: {
            fill: {
              value: 'black',
            },
            x: {
              field: fieldX,
              scale: 'xscale',
            },
            y: {
              field: fieldY,
              scale: 'yscale',
              offset: -8,
            },
            text: hasAggregation ?
            {
              template: metadata.bucketType === 'date' ?
                  '{{datum.bucketValue | time:"%Y-%b-%d %H-%M"}}'
                  :
                  `${metadata.bucketName.substring(0, 64)}: {{datum.bucketValue}}`
                ,
            }
              :
            {
              template: metadata.datapointLabelType === 'date' ?
                  '{{datum.datapointLabel | time:"%Y-%b-%d %H-%M"}}'
                  :
                  '{{datum.datapointLabel}}'
                ,
            },
            align: {
              value: 'center',
            },
          },
        },
      },
    ],
    signals: [
      {
        name: 'hover',
        init: '{}',
        streams: [
          {
            type: 'symbol:mouseover',
            expr: 'datum',
          },
          {
            type: 'symbol:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  });
}
