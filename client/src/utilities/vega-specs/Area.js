export default function getVegaAreaSpec(visualisation, data, containerHeight, containerWidth) {
  const { visualisationType } = visualisation;

  return ({
    data: [data],
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
        zero: true,
        domain: {
          data: 'table',
          field: 'x',
        },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        domain: {
          data: 'table',
          field: 'y',
        },
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        ticks: 20,
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
            data: 'table',
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: 'x',
              },
              y: {
                scale: 'y',
                field: 'y',
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
            data: 'table',
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: 'x',
              },
              y: {
                scale: 'y',
                field: 'y',
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
