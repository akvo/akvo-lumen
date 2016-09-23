export default function getVegaAreaSpec(visualisation, data, containerHeight, containerWidth) {
  const { visualisationType } = visualisation;
  const hasAggregation = Boolean(visualisation.spec.datasetGroupColumnX &&
    visualisation.spec.aggregationTypeY);
  const dataArray = [data];
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
    dataArray.push(transform1);
  }

  const dataSource = hasAggregation ? 'summary' : 'table';
  const fieldX = hasAggregation ? 'aggregationValue' : 'x';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';

  return ({
    data: dataArray,
    height: containerHeight - 80,
    width: containerWidth - 70,
    padding: {
      top: 30,
      right: 20,
      bottom: 50,
      left: 50,
    },
    scales: [
      {
        name: 'x',
        type: 'linear',
        range: 'width',
        zero: !hasAggregation,
        domain: {
          data: dataSource,
          field: fieldX,
        },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        domain: {
          data: dataSource,
          field: fieldY,
        },
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: visualisation.spec.labelX,
      },
      {
        type: 'y',
        scale: 'y',
        title: visualisation.spec.labelY,
      },
    ],
    marks: [
      visualisationType === 'area' ?
        {
          type: 'area',
          from: {
            data: dataSource,
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: fieldX,
              },
              y: {
                scale: 'y',
                field: fieldY,
              },
              y2: {
                scale: 'y',
                value: 0,
              },
              fill: {
                value: 'rgb(149, 150, 184)',
              },
            },
          },
        }
        :
        {
          type: 'line',
          from: {
            data: dataSource,
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: fieldX,
              },
              y: {
                scale: 'y',
                field: fieldY,
              },
              y2: {
                scale: 'y',
                value: 0,
              },
              stroke: {
                value: 'rgb(149, 150, 184)',
              },
            },
          },
        },
    ],
  });
}
