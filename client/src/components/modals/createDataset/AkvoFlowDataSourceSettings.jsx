import React, { Component, PropTypes } from 'react';
import Select from 'react-select';
import fetch from 'isomorphic-fetch';
// import * as api from '../../../api';

const FLOW_API_URL = 'http://localhost:3333/flow/instance';

function rootFoldersUrl(flowInstance) {
  return `${FLOW_API_URL}/${flowInstance}/folders?parentId=0`;
}

function merge(a, b) {
  return Object.assign({}, a, b);
}

function indexById(objects) {
  return objects.reduce((index, obj) => merge(index, { [obj.id]: obj }), {});
}

export default class AkvoFlowDataSourceSettings extends Component {
  static isValidSource({ instance, surveyId, formId }) {
    return typeof instance === 'string'
      && typeof surveyId === 'string'
      && typeof formId === 'string';
  }

  constructor(props) {
    super(props);
    this.state = {
      instance: null,
      // selected folder ids,
      selectedFolders: [],
      selectedSurveyId: null,
      selectedFormId: null,
      // store of all fetched folders, surveys and survey definitions
      folders: {},
      surveys: {},
      surveyDefinitions: {},
    };
  }

  resetSelections() {
    this.setState({
      selectedFolders: [],
      selectedSurveyId: null,
      selectedFormId: null,
    });
  }

  handleFlowInstanceChange(text) {
    const delay = 900; // ms
    clearTimeout(this.flowInstanceChangeTimeout);
    this.resetSelections();
    this.flowInstanceChangeTimeout = setTimeout(
      () => {
        if (text.trim() === '') return;
        this.setState({ instance: text });
        fetch(rootFoldersUrl(text))
          .then(response => (response.ok ? response.json() : new Error()))
          .then(root => this.setState({
            folders: merge(this.state.folders, indexById(root.folders)),
            selectedFolders: [],
          }));
      },
      delay
    );
  }

  folderSelectionOptions(parentId) {
    return Object
      .values(this.state.folders)
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        label: folder.name,
        value: folder.id,
      }));
  }

  surveySelectionOptions(folderId) {
    return Object
     .values(this.state.surveys)
     .filter(survey => survey.folderId === folderId)
     .map(survey => ({
       label: survey.name,
       value: survey.id,
     }));
  }

  formSelectionOptions(surveyId) {
    const surveyDefinition = this.state.surveyDefinitions[surveyId];
    if (surveyDefinition != null) {
      return surveyDefinition.forms.map(form => ({
        label: form.name,
        value: form.id,
      }));
    }
    return [];
  }

  foldersAndSurveysSelectionOptions(parentId) {
    return this.folderSelectionOptions(parentId).concat(this.surveySelectionOptions(parentId));
  }

  handleFolderSelection(selectedFolderId) {
    const { selectedFolders } = this.state;
    const selectedFolder = this.state.folders[selectedFolderId];
    this.setState({ selectedFolders: selectedFolders.concat([selectedFolderId]) });
    Promise.all([
      fetch(selectedFolder.foldersUrl).then(resp => (resp.ok ? resp.json() : { folders: [] })),
      fetch(selectedFolder.surveysUrl).then(resp => (resp.ok ? resp.json() : { surveys: [] })),
    ]).then(([{ folders }, { surveys }]) => this.setState({
      surveys: merge(this.state.surveys, indexById(surveys)),
      folders: merge(this.state.folders, indexById(folders)),
    }));
  }

  handleSurveySelection(selectedSurveyId) {
    const { surveys, surveyDefinitions } = this.state;
    this.setState({ selectedSurveyId });
    const surveyUrl = surveys[selectedSurveyId].surveyUrl;
    fetch(surveyUrl)
      .then(resp => (resp.ok ? resp.json() : null))
      .then((surveyDefinition) => {
        this.setState({
          surveyDefinitions: merge(surveyDefinitions, {
            [surveyDefinition.id]: surveyDefinition,
          }),
        });
      });
  }

  handleFormSelection(selectedFormId) {
    this.setState({ selectedFormId });
    this.props.onChange({
      kind: 'AKVO_FLOW',
      instance: this.state.instance,
      surveyId: this.state.selectedSurveyId,
      formId: selectedFormId,
    });
  }

  handleSelection(evt) {
    const selectedId = evt.value;
    const { folders } = this.state;

    if (folders[selectedId] != null) {
      this.handleFolderSelection(selectedId);
    } else {
      this.handleSurveySelection(selectedId);
    }
  }

  render() {
    const {
      selectedFolders,
      selectedSurveyId,
      selectedFormId,
      folders,
    } = this.state;

    const folderSelections = selectedFolders.map((id) => {
      const selectedFolder = folders[id];
      const parentId = selectedFolder.parentId;
      const options = this.foldersAndSurveysSelectionOptions(parentId);
      return (
        <Select
          options={options}
          value={id}
        />
      );
    });

    const lastSelectedFolderId = selectedFolders.length === 0 ?
      '0' : selectedFolders[selectedFolders.length - 1];

    // Either a survey or a folder can be selected
    const nextSelection = (
      <Select
        options={this.foldersAndSurveysSelectionOptions(lastSelectedFolderId)}
        value={selectedSurveyId}
        onChange={evt => this.handleSelection(evt)}
      />
    );

    const formSelection = selectedSurveyId != null && (
      <Select
        options={this.formSelectionOptions(selectedSurveyId)}
        value={selectedFormId}
        onChange={evt => this.handleFormSelection(evt.value)}
      />
    );

    return (
      <div>
        <input
          placeholder="Flow Application URL"
          onChange={evt => this.handleFlowInstanceChange(evt.target.value)}
          type="text"
          style={{ width: '300px' }}
        />
        {folderSelections}
        {nextSelection}
        {selectedSurveyId != null && formSelection}
      </div>
    );
  }
}

AkvoFlowDataSourceSettings.propTypes = {
  dataSource: PropTypes.shape({
    instance: PropTypes.string,
    surveyId: PropTypes.string,
    formId: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onChangeSettings: PropTypes.func.isRequired,
};
