export default function getVegaScatterSpec(visualisation, data, containerHeight, containerWidth) {
  return ({
    data: [data],
    width: containerWidth - 90,
    height: containerHeight - 100,
    padding: {
      top: 30,
      left: 60,
      bottom: 70,
      right: 30,
    },
    scales: [
      {
        name: 'xscale',
        type: 'linear',
        domain: {
          data: 'table',
          field: 'x',
        },
        range: 'width',
        nice: false,
      },
      {
        name: 'yscale',
        type: 'linear',
        domain: {
          data: 'table',
          field: 'y',
        },
        range: 'height',
        nice: true,
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'xscale',
        orient: 'bottom',
        title: 'x',
      },
      {
        type: 'y',
        scale: 'yscale',
        orient: 'left',
        title: 'y',
      },
    ],
    marks: [
      {
        type: 'text',
        from: {
          data: 'table',
        },
        properties: {
          enter: {
            fill: {
              value: 'black',
            },
            x: {
              field: 'x',
              scale: 'xscale',
            },
            y: {
              field: 'y',
              scale: 'yscale',
              offset: -8,
            },
            text: {
              field: 'label',
            },
            align: {
              value: 'center',
            },
          },
          update: {
            fillOpacity: [
              {
                test: 'hover._id == datum._id',
                value: 1,
              },
              { value: 0 },
            ],
          },
        },
      },
      {
        type: 'symbol',
        from: {
          data: 'table',
        },
        properties: {
          enter: {
            x: {
              field: 'x',
              scale: 'xscale',
            },
            y: {
              field: 'y',
              scale: 'yscale',
            },
            size: { value: 50 },
            opacity: { value: 0.8 },
          },
          update: {
            fill: { value: 'rgb(149, 150, 184)' },
          },
          hover: {
            fill: { value: 'rgb(43, 182, 115)' },
          },
        },
      },
    ],
    signals: [
      {
        name: 'hover',
        init: { },
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
      {
        name: 'position',
        init: '{}',
        streams: [
          { type: 'symbol:mouseover', expr: 'datum' },
          { type: 'symbol:mouseout', expr: '{}' },
        ],
      },
    ],
  });
}
