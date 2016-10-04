import React, { Component, PropTypes } from 'react';
import Select from 'react-select';
import fetch from 'isomorphic-fetch';
import headers from '../../../actions/headers';

function findRootFolderIds(surveysAndFolders) {
  const folderIds = {};
  const ids = [];
  surveysAndFolders.forEach(({ id, folderId }) => {
    folderIds[folderId] = null;
    ids.push(id);
  });
  ids.forEach(id => delete folderIds[id]);
  return Object.keys(folderIds).map(id => parseInt(id, 10));
}

function foldersAndSurveysComparator(a, b) {
  if (a.type !== b.type) {
    return a.type === 'folder' ? 1 : -1;
  }
  return a.title.localeCompare(b.title);
}

const initialState = {
  instances: [],
  selectedFolders: [],
  selectedSurveyId: null,
  idIndex: {},
  folderIdIndex: {},
  rootFolderIds: [],
};

export default class AkvoFlowDataSourceSettings extends Component {
  static isValidSource({ instance, surveyId }) {
    return typeof instance === 'string' && typeof surveyId === 'number';
  }

  constructor(props) {
    super(props);
    this.state = initialState;
    this.handleSelectInstance = this.handleSelectInstance.bind(this);
    this.handleHierarchySelection = this.handleHierarchySelection.bind(this);
  }

  componentDidMount() {
    fetch('/api/flow/instances', {
      headers: headers(),
    })
    .then(response => response.json())
    .then(instances => this.setState(instances));
  }

  handleSelectInstance(instance) {
    const { dataSource, onChange } = this.props;
    onChange(Object.assign({}, dataSource, {
      instance: instance.value,
      surveyId: null,
    }));
    this.setState(Object.assign({}, initialState, {
      instances: this.state.instances,
    }));
    fetch(`/api/flow/folders-and-surveys/${instance.value}`, {
      headers: headers(),
    })
    .then(response => response.json())
    .then((foldersAndSurveys) => {
      /*
       * Build 2 indexes to avoid repetetive calculation in render():
       * - id -> folder or surveyId
       * - folderId -> sorted array of folders and surveys
       */
      const idIndex = {};
      const folderIdIndex = {};
      foldersAndSurveys.forEach((folderOrSurvey) => {
        idIndex[folderOrSurvey.id] = folderOrSurvey;
        let existingFoldersAndSurveys = folderIdIndex[folderOrSurvey.folderId];
        if (existingFoldersAndSurveys === undefined) {
          existingFoldersAndSurveys = [];
        }
        existingFoldersAndSurveys.push(folderOrSurvey);
        folderIdIndex[folderOrSurvey.folderId] = existingFoldersAndSurveys;
      });

      Object.keys(folderIdIndex).forEach((folderId) => {
        folderIdIndex[folderId].sort(foldersAndSurveysComparator);
      });

      const rootFolderIds = findRootFolderIds(foldersAndSurveys);

      this.setState({ rootFolderIds, idIndex, folderIdIndex });
    });
  }

  handleSurveySelection(survey) {
    const { dataSource, onChange, onChangeSettings } = this.props;
    this.setState({ selectedSurveyId: survey.id });
    onChange(Object.assign({}, dataSource, {
      surveyId: survey.id,
    }));
    onChangeSettings({ name: survey.title });
  }

  handleFolderSelection(folder, idx) {
    const { dataSource, onChange } = this.props;
    const { selectedFolders } = this.state;
    const nextSelectedFolders = selectedFolders.slice(0, idx);
    nextSelectedFolders.push(folder.id);
    this.setState({ selectedFolders: nextSelectedFolders, selectedSurveyId: null });
    onChange(Object.assign({}, dataSource, {
      surveyId: null,
    }));
  }

  handleHierarchySelection(id, idx) {
    const surveyOrFolder = this.state.idIndex[id.value];
    if (surveyOrFolder.type === 'survey') {
      this.handleSurveySelection(surveyOrFolder);
    } else {
      this.handleFolderSelection(surveyOrFolder, idx);
    }
  }

  render() {
    const { dataSource } = this.props;
    const {
      instances,
      selectedFolders,
      rootFolderIds,
      folderIdIndex,
      selectedSurveyId,
    } = this.state;
    const instanceOptions = instances.map(instance => ({
      value: instance,
      label: instance,
    }));

    let hierarchyOptions = [];

    if (rootFolderIds.length !== 0) {
      hierarchyOptions.push(
        [].concat([], ...rootFolderIds.map((rootFolderId) => {
          const surveysAndFolders = folderIdIndex[rootFolderId];
          return surveysAndFolders.map(({ id, title }) => ({
            value: id,
            label: title,
          }));
        }))
      );

      hierarchyOptions = hierarchyOptions.concat(selectedFolders.map((folderId) => {
        const foldersAndSurveys = folderIdIndex[folderId];
        return foldersAndSurveys.map(({ id, title }) => ({
          value: id,
          label: title,
        }));
      }));
    }
    const hierarchySelections = hierarchyOptions.map((options, idx) => {
      const selectedId = selectedFolders[idx] || selectedSurveyId;
      return (
        <Select
          placeholder="Select a folder or survey"
          clearable={false}
          options={options}
          value={selectedId}
          onChange={id => this.handleHierarchySelection(id, idx)}
        />
      );
    });

    return (
      <div>
        <Select
          placeholder="Select a FLOW instance"
          clearable={false}
          options={instanceOptions}
          value={dataSource.instance}
          onChange={this.handleSelectInstance}
        />
        {hierarchySelections}
      </div>
    );
  }
}

AkvoFlowDataSourceSettings.propTypes = {
  dataSource: PropTypes.shape({
    instance: PropTypes.string,
    surveyId: PropTypes.number,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onChangeSettings: PropTypes.func.isRequired,
};
