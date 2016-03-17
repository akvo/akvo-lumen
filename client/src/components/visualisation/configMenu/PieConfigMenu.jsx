import React, { PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';

const getDatasetArray = datasetObject => {
  const datasetArray = [];
  const sortFunction = (a, b) => a.name.toLowerCase() > b.name.toLowerCase();

  Object.keys(datasetObject).forEach(key => {
    datasetArray.push(datasetObject[key]);
  });

  datasetArray.sort(sortFunction);

  return datasetArray;
};

const getDatasetOptions = (datasetArray) => {
  const output = [];

  datasetArray.forEach(option => {
    output.push({
      value: option.id, label: option.name,
    });
  });

  return output;
};

const getDashSelectOptionsFromColumnArray = (array) => {
  const output = [];

  if (array) {
    array.forEach((entry, index) => {
      output.push({
        value: index, label: entry.title,
      });
    });
  }
  return output;
};

export default function PieConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const visualisation = props.visualisation;
  let xColumns = [];

  if (props.datasets[visualisation.sourceDatasetX]) {
    xColumns = props.datasets[visualisation.sourceDatasetX].columns || [];
  }

  const datasetOptions = getDatasetOptions(datasetArray);
  const columnOptionsX = getDashSelectOptionsFromColumnArray(xColumns);

  return (
    <div className="PieConfigMenu">
      <div className="inputGroup">
        <label htmlFor="chartTitle">Chart title:</label>
        <input
          className="textInput"
          type="text"
          id="chartTitle"
          placeholder="Untitled chart"
          defaultValue={visualisation.name}
          onChange={props.onChangeTitle}
        />
      </div>
      <div className="inputGroup">
        <label htmlFor="xDatasetMenu">Source dataset:</label>
        <DashSelect
          name="xDatasetMenu"
          value={visualisation.sourceDatasetX || 'Choose a dataset option...'}
          options={datasetOptions}
          onChange={props.onChangeSourceDatasetX}
        />
      </div>
      <div className="inputGroup">
        <label htmlFor="xColumnMenu">Dataset column:</label>
        <DashSelect
          name="xColumnMenu"
          value={visualisation.datasetColumnX || 'Choose a dataset column...'}
          options={columnOptionsX}
          onChange={props.onChangeDatasetColumnX}
        />
      </div>
        <div className="inputGroup">
          <label htmlFor="xNameColumnMenu">Label column:</label>
          <DashSelect
            name="xNameColumnMenu"
            disabled={xColumns.length === 0}
            value={visualisation.datasetNameColumnX || 'Choose a name column...'}
            onChange={props.onChangeDatasetNameColumnX}
            options={columnOptionsX}
          />
        </div>
    </div>
  );
}

PieConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeSourceDatasetX: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetNameColumnX: PropTypes.func.isRequired,
};
