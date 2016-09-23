export default function getVegaBarSpec(visualisation, data, containerHeight, containerWidth) {
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
          data: dataSource,
          field: fieldX,
        },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        domain: {
          data: dataSource,
          field: fieldY,
        },
        nice: true,
      },
      {
        name: 'xlabels',
        type: 'ordinal',
        domain: {
          data: dataSource,
          field: fieldX,
        },
        range: {
          data: dataSource,
          field: fieldX,
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
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: fieldX,
            },
            width: {
              scale: 'x',
              band: true,
              offset: -1,
            },
            y: {
              scale: 'y',
              field: fieldY,
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
              signal: `tooltip.${fieldX}`,
            },
            dx: {
              scale: 'x',
              band: true,
              mult: 0.5,
            },
            y: {
              scale: 'y',
              signal: `tooltip.${fieldY}`,
              offset: -5,
            },
            text: {
              signal: 'tooltipText',
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
      {
        name: 'tooltipText',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: hasAggregation ?
              // Round aggregation metrics to 3 sig figs for tooltip
              `floor(datum.${transformType}_y * 1000) / 1000`
              :
              'datum.y'
            ,
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
