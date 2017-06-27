import { palette } from '../visualisationColors';

export default function getVegaPieSpec(visualisation, data, containerHeight, containerWidth,
  chartSize) {
  const chartRadius = containerHeight < containerWidth ? containerHeight / 3 : containerWidth / 3;
  const innerRadius = visualisation.visualisationType === 'donut' ?
    Math.floor(chartRadius / 1.75) : 0;
  const dataArray = data;

  const layoutTransform = {
    name: 'pie',
    source: 'table',
    transform: [
      {
        type: 'pie',
        field: 'bucketCount',
      },
      {
        type: 'formula',
        field: 'rounded_value',
        expr: 'floor(datum.bucketCount * 1000) / 1000', // round label to 3 decimal places
      },
      {
        type: 'formula',
        field: 'percentage',
        expr: '((datum.layout_end - datum.layout_start) / (2 * PI)) * 100',
      },
      {
        type: 'formula',
        field: 'rounded_percentage',
        // round percentage to 2 decimal places for labels
        expr: 'floor(datum.percentage * 100) / 100',
      },

    ],
  };

  dataArray.push(layoutTransform);

  const dataSource = 'pie';
  const segmentLabelField = 'bucketValue';
  const fieldY = 'bucketCount';
  const showLegend = visualisation.spec.showLegend;

  let fontSize;

  switch (chartSize) {
    case 'xsmall':
      fontSize = 10;
      break;

    case 'small':
      fontSize = 12;
      break;

    case 'medium':
      fontSize = 14;
      break;

    case 'large':
    case 'xlarge':
    default:
      fontSize = 16;
      break;

  }

  return ({
    data: dataArray,
    width: showLegend ? (chartRadius * 2) : containerWidth - 20,
    height: containerHeight - 20,
    padding: {
      top: 10,
      right: 10 + showLegend ? containerWidth - (chartRadius * 2) - 10 : 0,
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
        range: palette,
        domain: {
          data: dataSource,
          field: segmentLabelField,
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
            y: showLegend ?
              {
                value: chartRadius,
              }
              :
              {
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
            fill: [
              {
                test: 'datum._id == tooltip._id || datum._id == textTooltip._id',
                value: 'pink',
              },
              {
                scale: 'c',
                field: segmentLabelField,
              },
            ],
          },
        },
      },
      showLegend ?
        {
          type: 'text',
        }
        :
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
                offset: chartSize === 'xsmall' ? 15 : 30,
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
              fontSize: {
                value: fontSize - 2,
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
              test: 'datum._id == tooltip._id || datum._id == textTooltip._id',
            },
          ],
        },
        properties: {
          enter:
            showLegend ?
              {
                x: {
                  value: (chartRadius) - (chartRadius / 3),
                },
                y: {
                  value: (chartRadius * 2) + 35,
                },
                fill: {
                  value: 'black',
                },
                align: {
                  value: 'left',
                },
                text: {
                  template: `{{datum[${segmentLabelField}]}}: {{datum.rounded_value}} ({{datum.rounded_percentage}}%)`,
                },
                fontSize: {
                  value: fontSize,
                },
              }
              :
              {
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
                  template: '{{datum.rounded_value}} ({{datum.rounded_percentage}}%)',
                },
                fontSize: {
                  value: fontSize - 2,
                },
              }
            ,
        },
      },
    ],
    legends:
      showLegend ?
        [
          {
            fill: 'c',
            orient: 'right',
            title: visualisation.spec.legendTitle ? visualisation.spec.legendTitle : 'Legend',
            properties: {
              symbols: {
                shape: {
                  value: 'square',
                },
              },
              title: {
                fontSize: {
                  value: fontSize - 2,
                },
                dy: {
                  value: fontSize * -0.6,
                },
              },
              labels: {
                fontSize: {
                  value: fontSize - 4,
                },
              },
            },
          },
        ]
        :
        [],
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
      {
        name: 'textTooltip',
        init: {},
        streams: [
          {
            type: 'text:mouseover',
            expr: 'datum',
          },
          {
            type: 'text:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  });
}
