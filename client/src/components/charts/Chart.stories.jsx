/* eslint-disable no-plusplus, import/no-extraneous-dependencies */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, number, text, boolean, color } from '@storybook/addon-knobs/react';
import { palette as generatePalette } from '@potion/color';
import { interpolateSpectral } from 'd3-scale-chromatic';
import { hsl } from 'd3-color';

import '../../styles/reset.global.scss';
import '../../styles/style.global.scss';
import PieChart from './PieChart';
import ScatterChart from './ScatterChart';
import AreaChart from './AreaChart';
import BarChart from './BarChart';
import { sortAlphabetically } from '../../utilities/utils';

const letters = 'abcdef ghijklmn opqrstuvwxyz 123456789'.split('');
const letterCount = letters.length;

const randomString = (length = 10) => {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(letters[Math.floor(Math.random() * letterCount)]);
  }
  return result.join('');
};

const randomIntFromInterval = (min, max) => Math.floor((Math.random() * ((max - min) + 1)) + min);

const rainbowColors = [];
const intervals = 30;
const increment = 1 / intervals;
for (let i = 0; i < intervals; i++) {
  const c = hsl(interpolateSpectral(i * increment));
  rainbowColors.push(`${c}`);
}
const p = generatePalette({ colors: rainbowColors });

storiesOf('Charts', module)
  .addDecorator(withKnobs)

  .add('PieChart', () => {
    const nodeCount = number('node count', 20);
    const labelLength = number('label length', 10);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);

    const generateNodes = () => {
      const nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          bucketCount: randomIntFromInterval(minVal, maxVal),
          bucketValue: randomString(labelLength),
        });
      }
      return nodes.sort((a, b) => sortAlphabetically(a, b, ({ bucketValue }) => bucketValue));
    };
    const data = generateNodes();
    const c = p(nodeCount);
    const colors = data.reduce((acc, datum, i) => {
      const result = { ...acc };
      if (!result[datum.bucketValue]) {
        result[datum.bucketValue] = c[i];
      }
      return result;
    }, {});

    return (
      <div>
        <PieChart
          style={{ border: '1px solid black' }}
          data={{
            data,
            metadata: {
              bucketColumnTitle: text('props.data.metadata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={colors}
          innerRadius={number('props.innerRadius', 0)}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', true)}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('ScatterChart', () => {
    const nodeCount = number('node count', 10);
    const labelLength = number('label length', 10);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const generateNodes = () => {
      const nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          key: randomString(labelLength),
          x: randomIntFromInterval(minVal, maxVal),
          y: randomIntFromInterval(minVal, maxVal),
          r: randomIntFromInterval(minVal, maxVal),
        });
      }
      return nodes;
    };
    const data = generateNodes();
    const c = p(nodeCount);
    const colors = data.reduce((acc, datum, i) => {
      const result = { ...acc };
      if (!result[datum.key]) {
        result[datum.key] = c[i];
      }
      return result;
    }, {});

    return (
      <div>
        <ScatterChart
          style={{ border: '1px solid black' }}
          data={{
            data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={colors}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          opacity={number('props.opacity', 0.9)}
          // minRadius={number('props.minRadius')}
          // maxRadius={number('props.maxRadius')}
          marginTop={number('props.marginTop', 0.1)}
          marginRight={number('props.marginRight', 0.1)}
          marginBottom={number('props.marginBottom', 0.1)}
          marginLeft={number('props.marginLeft', 0.1)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', false)}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('AreaChart', () => {
    const nodeCount = number('node count', 20);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);

    const generateNodes = () => {
      const nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          key: i,
          x: i,
          y: randomIntFromInterval(minVal, maxVal),
        });
      }
      return nodes;
    };

    const data = generateNodes();

    return (
      <div>
        <AreaChart
          style={{ border: '1px solid black' }}
          data={{
            data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          color={color('props.color', '#5744B8')}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          marginTop={number('props.marginTop', 0.1)}
          marginRight={number('props.marginRight', 0.1)}
          marginBottom={number('props.marginBottom', 0.1)}
          marginLeft={number('props.marginLeft', 0.1)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('BarChart', () => {
    const nodeCount = number('node count', 20);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const labelLength = number('label length', 10);

    const generateNodes = () => {
      const nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          key: randomString(labelLength),
          value: randomIntFromInterval(minVal, maxVal),
        });
      }
      return nodes.sort((a, b) =>
        sortAlphabetically(a, b, ({ key }) => key)
      );
    };

    const data = generateNodes();
    const c = p(nodeCount);
    const colors = data.reduce((acc, datum, i) => {
      const result = { ...acc };
      if (!result[datum.key]) {
        result[datum.key] = c[i];
      }
      return result;
    }, {});

    return (
      <div>
        <BarChart
          style={{ border: '1px solid black' }}
          data={{
            data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={colors}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          padding={number('props.padding', 0.1)}
          marginTop={number('props.marginTop', 0.1)}
          marginRight={number('props.marginRight', 0.1)}
          marginBottom={number('props.marginBottom', 0.2)}
          marginLeft={number('props.marginLeft', 0.1)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', false)}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('BarChart (Stacked)', () => {
    const nodeCount = number('node count', 20);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const labelLength = number('label length', 10);

    const generateNodes = () => {
      const nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          key: randomString(labelLength),
          values: [
            randomIntFromInterval(minVal, maxVal),
            randomIntFromInterval(minVal, maxVal),
            randomIntFromInterval(minVal, maxVal),
          ],
        });
      }
      return nodes;
    };

    const data = generateNodes();
    const c = p(nodeCount);
    const colors = data.reduce((acc, datum, i) => {
      const result = { ...acc };
      if (!result[datum.key]) {
        result[datum.key] = c[i];
      }
      return result;
    }, {});

    return (
      <div>
        <BarChart
          style={{ border: '1px solid black' }}
          data={{
            data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={colors}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          marginTop={number('props.marginTop', 0.1)}
          marginRight={number('props.marginRight', 0.1)}
          marginBottom={number('props.marginBottom', 0.2)}
          marginLeft={number('props.marginLeft', 0.1)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', true)}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  });
