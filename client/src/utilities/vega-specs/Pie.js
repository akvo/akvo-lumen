export default function getVegaPieSpec(visualisation, data, containerHeight, containerWidth) {
  const chartRadius = containerHeight < containerWidth ? containerHeight / 3 : containerWidth / 3;
  const innerRadius = visualisation.visualisationType === 'donut' ?
    Math.floor(chartRadius / 1.75) : 0;

  return ({
    data: [data],
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
          data: 'table',
          field: 'y',
        },
        range: [chartRadius],
      },
      {
        name: 'c',
        type: 'ordinal',
        range: 'category10',
        domain: {
          data: 'table',
          field: 'y',
        },
      },
    ],
    marks: [
      {
        type: 'arc',
        from: {
          data: 'table',
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
              field: 'y',
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
          data: 'table',
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
              field: 'y',
            },
          },
        },
      },
      {
        type: 'text',
        from: {
          data: 'table',
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
              offset: 70,
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
              field: 'label',
            },
          },
          update: {
            fillOpacity: [
              {
                test: 'tooltip._id != datum._id',
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
