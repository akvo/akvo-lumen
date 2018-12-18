/* eslint-disable padded-blocks */
import assert from 'assert';
import { remapVisualisationDataColumnMappings } from '../../src/utilities/visualisation';

describe('Utility: Visualisation', () => {
  describe('remapVisualisationDataColumnMappings()', () => {

    describe('map ->', () => {
      it('pivot table', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'pivot table');
        assert.deepStrictEqual(result, {});
      });
      it('bar', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'bar');
        assert.deepStrictEqual(result, {});
      });
      it('line', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'line');
        assert.deepStrictEqual(result, {});
      });
      it('area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'area');
        assert.deepStrictEqual(result, {});
      });
      it('pie', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'pie');
        assert.deepStrictEqual(result, {});
      });
      it('donut', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'donut');
        assert.deepStrictEqual(result, {});
      });
      it('scatter', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'scatter');
        assert.deepStrictEqual(result, {});
      });
      it('bubble', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'map',
          spec: {
            foo: 'bar',
          },
        }, 'bubble');
        assert.deepStrictEqual(result, {});
      });
    });

    describe('pivot table ->', () => {
      it('map', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            foo: 'bar',
          },
        }, 'map');
        assert.deepStrictEqual(result, {});
      });
      it('bar', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            foo: 'bar',
            valueColumn: 'A',
            categoryColumn: 'B',
          },
        }, 'bar');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          bucketColumn: 'B',
        });
      });
      it('line', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            foo: 'bar',
            valueColumn: 'A',
          },
        }, 'line');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
        });
      });
      it('area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            valueColumn: 'A',
            foo: 'bar',
          },
        }, 'area');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
        });
      });
      it('pie', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            categoryColumn: 'A',
            foo: 'bar',
          },
        }, 'pie');
        assert.deepStrictEqual(result, { bucketColumn: 'A' });
      });
      it('donut', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            foo: 'bar',
            categoryColumn: 'A',
          },
        }, 'donut');
        assert.deepStrictEqual(result, { bucketColumn: 'A' });
      });
      it('scatter', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            foo: 'bar',
            valueColumn: 'A',
            categoryColumn: 'B',
          },
        }, 'scatter');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          bucketColumnCategory: 'B',
        });
      });
      it('bubble', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pivot table',
          spec: {
            foo: 'bar',
            valueColumn: 'A',
            categoryColumn: 'B',
          },
        }, 'bubble');
        assert.deepStrictEqual(result, {
          metricColumn: 'A',
          bucketColumn: 'B',
        });
      });
    });

    describe('bar ->', () => {
      it('map', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            foo: 'bar',
          },
        }, 'map');
        assert.deepStrictEqual(result, {});
      });
      it('pivot table', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
            bucketColumn: 'B',
          },
        }, 'pivot table');
        assert.deepStrictEqual(result, {
          valueColumn: 'A',
          categoryColumn: 'B',
        });
      });
      it('line', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
          },
        }, 'line');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
        });
      });
      it('area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            metricColumnY: 'A',
            foo: 'bar',
          },
        }, 'area');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
        });
      });
      it('pie', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            bucketColumn: 'A',
            foo: 'bar',
          },
        }, 'pie');
        assert.deepStrictEqual(result, { bucketColumn: 'A' });
      });
      it('donut', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
          },
        }, 'donut');
        assert.deepStrictEqual(result, { bucketColumn: 'A' });
      });
      it('scatter', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
            metricColumnY: 'B',
          },
        }, 'scatter');
        assert.deepStrictEqual(result, {
          bucketColumnCategory: 'A',
          metricColumnY: 'B',
        });
      });
      it('bubble', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bar',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
            bucketColumn: 'B',
          },
        }, 'bubble');
        assert.deepStrictEqual(result, {
          metricColumn: 'A',
          bucketColumn: 'B',
        });
      });
    });

    describe('line/area ->', () => {
      it('map', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            foo: 'bar',
          },
        }, 'map');
        assert.deepStrictEqual(result, {});
      });
      it('pivot table', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
          },
        }, 'pivot table');
        assert.deepStrictEqual(result, {
          valueColumn: 'A',
        });
      });
      it('bar', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
            metricColumnX: 'B',
          },
        }, 'bar');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          metricColumnX: 'B',
        });
      });
      it('area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            metricColumnY: 'A',
            metricColumnX: 'B',
            foo: 'bar',
          },
        }, 'area');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          metricColumnX: 'B',
        });
      });
      it('pie/donut', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            foo: 'bar',
          },
        }, 'pie');
        assert.deepStrictEqual(result, {});
      });
      it('scatter', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            foo: 'bar',
            metricColumnX: 'A',
            metricColumnY: 'B',
          },
        }, 'scatter');
        assert.deepStrictEqual(result, {
          metricColumnX: 'A',
          metricColumnY: 'B',
        });
      });
      it('bubble', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'line',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
          },
        }, 'bubble');
        assert.deepStrictEqual(result, {
          metricColumn: 'A',
        });
      });
    });

    describe('pie/donut ->', () => {
      it('map', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pie',
          spec: {
            foo: 'bar',
          },
        }, 'map');
        assert.deepStrictEqual(result, {});
      });
      it('pivot table', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pie',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
          },
        }, 'pivot table');
        assert.deepStrictEqual(result, {
          categoryColumn: 'A',
        });
      });
      it('bar', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pie',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
          },
        }, 'bar');
        assert.deepStrictEqual(result, {
          bucketColumn: 'A',
        });
      });
      it('line/area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pie',
          spec: {
            foo: 'bar',
          },
        }, 'line');
        assert.deepStrictEqual(result, {});
      });
      it('scatter', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pie',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
          },
        }, 'scatter');
        assert.deepStrictEqual(result, {
          bucketColumnCategory: 'A',
        });
      });
      it('bubble', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'pie',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
            legendTitle: 'B',
          },
        }, 'bubble');
        assert.deepStrictEqual(result, {
          bucketColumn: 'A',
          legendTitle: 'B',
        });
      });
    });

    describe('scatter ->', () => {
      it('map', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'scatter',
          spec: {
            foo: 'bar',
          },
        }, 'map');
        assert.deepStrictEqual(result, {});
      });
      it('pivot table', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'scatter',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
            bucketColumn: 'B',
          },
        }, 'pivot table');
        assert.deepStrictEqual(result, {
          valueColumn: 'A',
          categoryColumn: 'B',
        });
      });
      it('bar', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'scatter',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
            bucketColumnCategory: 'B',
          },
        }, 'bar');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          bucketColumn: 'B',
        });
      });
      it('line/area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'scatter',
          spec: {
            foo: 'bar',
            metricColumnY: 'A',
            metricColumnX: 'B',
          },
        }, 'line');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          metricColumnX: 'B',
        });
      });
      it('pie/donut', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'scatter',
          spec: {
            foo: 'bar',
            bucketColumnCategory: 'A',
          },
        }, 'pie');
        assert.deepStrictEqual(result, {
          bucketColumn: 'A',
        });
      });
      it('bubble', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'scatter',
          spec: {
            foo: 'bar',
            bucketColumnCategory: 'A',
            metricColumnSize: 'B',
            metricLabel: 'C',
            metricLabelFromUser: 'D',
            legendTitle: 'E',
          },
        }, 'bubble');
        assert.deepStrictEqual(result, {
          bucketColumn: 'A',
          metricColumn: 'B',
          categoryLabel: 'C',
          categoryLabelFromuser: 'D',
          legendTitle: 'E',
        });
      });
    });

    describe('bubble ->', () => {
      it('map', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bubble',
          spec: {
            foo: 'bar',
          },
        }, 'map');
        assert.deepStrictEqual(result, {});
      });
      it('pivot table', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bubble',
          spec: {
            foo: 'bar',
            metricColumn: 'A',
            bucketColumn: 'B',
          },
        }, 'pivot table');
        assert.deepStrictEqual(result, {
          valueColumn: 'A',
          categoryColumn: 'B',
        });
      });
      it('bar', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bubble',
          spec: {
            foo: 'bar',
            metricColumn: 'A',
            bucketColumn: 'B',
          },
        }, 'bar');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
          bucketColumn: 'B',
        });
      });
      it('line/area', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bubble',
          spec: {
            foo: 'bar',
            metricColumn: 'A',
          },
        }, 'line');
        assert.deepStrictEqual(result, {
          metricColumnY: 'A',
        });
      });
      it('pie/donut', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bubble',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
          },
        }, 'pie');
        assert.deepStrictEqual(result, {
          bucketColumn: 'A',
        });
      });
      it('scatter', () => {
        const result = remapVisualisationDataColumnMappings({
          visualisationType: 'bubble',
          spec: {
            foo: 'bar',
            bucketColumn: 'A',
            metricColumn: 'B',
            categoryLabel: 'C',
            categoryLabelFromuser: 'D',
            legendTitle: 'E',
          },
        }, 'scatter');
        assert.deepStrictEqual(result, {
          bucketColumnCategory: 'A',
          metricColumnSize: 'B',
          metricLabel: 'C',
          metricLabelFromUser: 'D',
          legendTitle: 'E',
        });
      });
    });

  });
});
