export default function getVegaBarSpec(visualisation, data, containerHeight, containerWidth) {
  return ({
    data: [data],
    width: containerWidth - 70,
    height: containerHeight - 96,
    padding: {
      top: 26,
      left: 60,
      bottom: 70,
      right: 10,
    },
    scales: [
      {
        name: 'x',
        type: 'ordinal',
        range: 'width',
        domain: {
          data: 'table',
          field: 'x',
        },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        domain: {
          data: 'table',
          field: 'y',
        },
        nice: true,
      },
      {
        name: 'xlabels',
        type: 'ordinal',
        domain: {
          data: 'table',
          field: 'x',
        },
        range: {
          data: 'table',
          field: 'label',
        },
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: visualisation.spec.labelX,
        tickPadding: 0,
        properties: visualisation.spec.datasetNameColumnX != null ?
          {
            labels: {
              text: {
                scale: 'xlabels',
              },
              angle: {
                value: 35,
              },
              align: {
                value: 'left',
              },
            },
          }
          :
          {}
        ,
      },
      {
        type: 'y',
        scale: 'y',
        title: visualisation.spec.labelY,
      },
    ],
    marks: [
      {
        type: 'rect',
        from: {
          data: 'table',
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: 'x',
            },
            width: {
              scale: 'x',
              band: true,
              offset: -1,
            },
            y: {
              scale: 'y',
              field: 'y',
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
              signal: 'tooltip.x',
            },
            dx: {
              scale: 'x',
              band: true,
              mult: 0.5,
            },
            y: {
              scale: 'y',
              signal: 'tooltip.y',
              offset: -5,
            },
            text: {
              signal: 'tooltip.y',
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
    ],
  });
}
