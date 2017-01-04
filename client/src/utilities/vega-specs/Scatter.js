export default function getVegaScatterSpec(visualisation, data, containerHeight, containerWidth) {
  const hasAggregation = Boolean(visualisation.spec.bucketColumn &&
    visualisation.spec.metricAggregation);
  const dataArray = data.map(item => item);
  const transformType = hasAggregation ? visualisation.spec.metricAggregation : null;
  const dataSource = 'table';
  const fieldX = hasAggregation ? `${transformType}_x` : 'x';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';

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

  if (visualisation.spec.metricColumnXType === 'date') {
    scales.push({
      name: 'dateScale',
      type: 'linear',
      domain: {
        data: dataSource,
        field: 'dateLabelX',
      },
      range: 'width',
      zero: false,
      nice: false,
    });
  }

  const xAxis = {
    type: 'x',
    scale: 'xscale',
    orient: 'bottom',
    title: visualisation.spec.axisLabelX,
  };

  if (visualisation.spec.metricColumnXType === 'date') {
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

  return ({
    data: dataArray,
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
      {
        type: 'y',
        scale: 'yscale',
        orient: 'left',
        title: visualisation.spec.axisLabelY,
      },
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
                value: 0.2,
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
                template: visualisation.spec.bucketColumnType === 'date' ?
                  '{{datum.bucketValue | time:"%Y-%b-%d %H-%M"}}'
                  :
                  '{{datum.bucketValue}}'
                ,
              }
              :
              {
                template: visualisation.spec.datapointLabelType === 'date' ?
                  '{{datum.label | time:"%Y-%b-%d %H-%M"}}'
                  :
                  '{{datum.label}}'
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
