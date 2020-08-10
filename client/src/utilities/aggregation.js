import { isEqual } from 'lodash';
import { checkUndefined } from './utils';

export const specIsValidForApi = (spec, vType) => {
  let anyLayerInvalid;

  switch (vType) {
    case 'scatter':
      if (spec.metricColumnX === null || spec.metricColumnY === null) {
        return false;
      }
      break;
    case 'bar':
      if (spec.bucketColumn === null) {
        return false;
      }
      break;
    case 'bubble':
      if (spec.bucketColumn === null) {
        return false;
      }
      break;
    case 'line':
    case 'area':
      if (spec.metricColumnX === null || spec.metricColumnY === null) {
        return false;
      }
      break;
    case 'pivot table':
      if (spec.aggregation !== 'count' && spec.valueColumn == null) {
        return false;
      }
      break;
    case 'pie':
    case 'donut':
    case 'polararea':
      if (spec.bucketColumn === null) {
        return false;
      }
      break;
    case 'map':
      if (spec.layers.length === 0) {
        return false;
      }
      anyLayerInvalid = spec.layers.some(
        // Function that should return true if the current layer is invalid
        (layer) => {
          const missingDatasetId = !layer.datasetId;
          const missingRasterId = !layer.rasterId;

          if (layer.layerType === 'geo-shape') {
            return missingDatasetId || !layer.geom;
          } else if (layer.layerType === 'raster') {
            return missingRasterId;
          }

          // Some old maps don't have a layer-type in the layer spec, so just assume it's geopoint
          const missingGeom = !layer.geom;
          const missingLatLong = !(layer.latitude && layer.longitude);
          const missingAnyValidLocation = (missingGeom && missingLatLong);

          return (missingDatasetId || missingAnyValidLocation);
        }
      );

      if (anyLayerInvalid) {
        return false;
      }
      break;
    default:
      return false;
  }
  return true;
};

export const getNeedNewAggregation = (
  newV = { spec: {} },
  oldV = { spec: {} },
  optionalVizType
) => {
  const vType = newV.visualisationType || optionalVizType;

  if ((newV && !oldV) || (vType !== (oldV.visualisationType || 'map'))) {
    console.log('getNeedNewAggregation', newV, oldV, vType, oldV.visualisationType);
    return true;
  }
  const newLegendOrder = checkUndefined(newV, 'spec', 'legend', 'order') || {};
  const oldLegendOrder = checkUndefined(oldV, 'spec', 'legend', 'order') || {};

  switch (vType) {
    case 'bar':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.metricColumnX !== oldV.spec.metricColumnX ||
          newV.spec.metricColumnY !== oldV.spec.metricColumnY ||
          !isEqual(newV.spec.metricColumnsY, oldV.spec.metricColumnsY) ||
        newV.spec.metricAggregation !== oldV.spec.metricAggregation ||
        newV.spec.subBucketMethod !== oldV.spec.subBucketMethod ||
        newV.spec.bucketColumn !== oldV.spec.bucketColumn ||
        newV.spec.subBucketColumn !== oldV.spec.subBucketColumn ||
        newV.spec.sort !== oldV.spec.sort ||
        newV.spec.truncateSize !== oldV.spec.truncateSize ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );
    case 'bubble':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.metricColumn !== oldV.spec.metricColumn ||
        newV.spec.bucketColumn !== oldV.spec.bucketColumn ||
        newV.spec.metricAggregation !== oldV.spec.metricAggregation ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );
    case 'pivot table':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.aggregation !== oldV.spec.aggregation ||
        newV.spec.valueColumn !== oldV.spec.valueColumn ||
        newV.spec.categoryColumn !== oldV.spec.categoryColumn ||
        newV.spec.rowColumn !== oldV.spec.rowColumn ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );
    case 'pie':
    case 'donut':
    case 'polararea':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.bucketColumn !== oldV.spec.bucketColumn ||
        newV.spec.sort !== oldV.spec.sort ||
        !isEqual(newV.spec.filters, oldV.spec.filters) ||
        newLegendOrder.mode !== oldLegendOrder.mode ||
        !isEqual(newLegendOrder.list, oldLegendOrder.list)
      );
    case 'line':
    case 'area':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.metricColumnX !== oldV.spec.metricColumnX ||
        newV.spec.metricColumnY !== oldV.spec.metricColumnY ||
        newV.spec.metricAggregation !== oldV.spec.metricAggregation ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );
    case 'scatter':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.spec.metricColumnX !== oldV.spec.metricColumnX ||
        newV.spec.metricColumnY !== oldV.spec.metricColumnY ||
        newV.spec.metricColumnSize !== oldV.spec.metricColumnSize ||
        newV.spec.bucketColumnCategory !== oldV.spec.bucketColumnCategory ||
        newV.spec.metricAggregation !== oldV.spec.metricAggregation ||
        newV.spec.bucketColumn !== oldV.spec.bucketColumn ||
        newV.spec.datapointLabelColumn !== oldV.spec.datapointLabelColumn ||
        !isEqual(newV.spec.filters, oldV.spec.filters)
      );

    case 'map':
      return Boolean(
        newV.datasetId !== oldV.datasetId ||
        newV.rasterId !== oldV.rasterId ||
        newV.aggregationDataset !== oldV.aggregationDataset ||
        newV.aggregationColumn !== oldV.aggregationColumn ||
        newV.aggregationGeomColumn !== oldV.aggregationGeomColumn ||
        newV.aggregationMethod !== oldV.aggregationMethod ||
        newV.shapeLabelColumn !== oldV.shapeLabelColumn ||
        newV.latitude !== oldV.latitude ||
        newV.longitude !== oldV.longitude ||
        newV.geom !== oldV.geom ||
        newV.pointColorColumn !== oldV.pointColorColumn ||
        newV.pointSize !== oldV.pointSize ||
        newV.gradientColor !== oldV.gradientColor ||
        newV.startColor !== oldV.startColor ||
        newV.endColor !== oldV.endColor ||
        !isEqual(newV.filters, oldV.filters) ||
        !isEqual(newV.popup, oldV.popup) ||
        !isEqual(newV.pointColorMapping, oldV.pointColorMapping)
      );
    default:
      throw new Error(`Unknown visualisation type ${vType} supplied to getNeedNewAggregation`);
  }
};
