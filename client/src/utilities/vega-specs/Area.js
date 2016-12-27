export default function getVegaAreaSpec(visualisation, data, containerHeight, containerWidth) {
  const { visualisationType } = visualisation;
  const dataArray = data.map(item => item);
  const dataSource = 'table';
  const fieldX = visualisation.spec.metricColumnX !== null ? 'x' : 'index';
  const fieldY = 'y';
  return ({
    data: dataArray,
    height: containerHeight - 120,
    width: containerWidth - 70,
    padding: {
      top: 30,
      right: 20,
      bottom: 90,
      left: 50,
    },
    scales: [
      {
        name: 'x',
        type: 'linear',
        range: 'width',
        zero: false,
        nice: visualisation.spec.metricColumnXType === 'date', // round number origin
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
        title: visualisation.spec.axisLabelX,
        properties: {
          labels: {
            text: {
              template: visualisation.spec.metricColumnXType === 'date' ? '{{datum.data|time:"%Y-%m-%d %H:%M:%S"}}' : '{{datum.data}}',
            },
            angle: {
              value: 45,
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
        title: visualisation.spec.axisLabelY,
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
