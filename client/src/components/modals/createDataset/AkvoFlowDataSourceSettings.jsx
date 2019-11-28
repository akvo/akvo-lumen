import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { connect } from 'react-redux';
import { injectIntl, intlShape } from 'react-intl';

import * as api from '../../../utilities/api';
import { showNotification } from '../../../actions/notification';

// require('../../../../node_modules/react-select/dist/react-select.css');
// TODO: we should use the "SelectMenu" wrapper component in the "common" folder in this component

const acceptHeader = { Accept: 'application/vnd.akvo.flow.v2+json' };

function rootFoldersUrl(flowApiUrl, flowInstance) {
  return `${flowApiUrl}/orgs/${flowInstance}/folders`;
}

function merge(a, b) {
  return Object.assign({}, a, b);
}

function indexById(objects) {
  return objects.reduce((index, obj) => merge(index, { [obj.id]: obj }), {});
}

function parseInstance(text) {
  if (text == null || text.trim() === '') return null;
  const match = text.trim().toLowerCase().match(/^(https?:\/\/)?([a-z0-9_-]+)\.?.*$/);
  if (match != null) {
    return match[2];
  }
  return null;
}

export function isValidSource({ instance, surveyId, formId }) {
  return typeof instance === 'string'
    && typeof surveyId === 'string'
    && typeof formId === 'string';
}

class AkvoFlowDataSourceSettings extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoadingNext: false,
      isLoadingForms: false,
      errorMessage: null,
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
      isLoadingNext: false,
      isLoadingForms: false,
      errorMessage: null,
      instance: null,
      selectedFolders: [],
      selectedSurveyId: null,
      selectedFormId: null,
      folders: {},
      surveys: {},
      surveyDefinitions: {},
    });
  }

  handleFlowInstanceChange(text) {
    const { flowApiUrl } = this.props;
    const delay = 900; // ms
    clearTimeout(this.flowInstanceChangeTimeout);
    this.resetSelections();
    const instance = parseInstance(text);
    if (instance == null) return;
    this.setState({ instance, isLoadingNext: true });
    this.flowInstanceChangeTimeout = setTimeout(
      () => {
        api.get(rootFoldersUrl(flowApiUrl, instance), { parent_id: 0 }, acceptHeader)
          .then((response) => {
            this.setState({ isLoadingNext: false });
            if (response.ok) {
              return response.body;
            } else if (response.status === 404) {
              throw new Error(`No such flow instance: ${instance}`);
            } else if (response.status === 403) {
              throw new Error(`Not authorized: ${this.props.email}`);
            }
            throw new Error(`Unexpected response ${response.status}`);
          })
          .then(({ folders }) => this.setState({
            instance,
            folders: merge(this.state.folders, indexById(folders)),
          }))
          .catch(err => this.setState({ errorMessage: err.message }));
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
    this.setState({
      isLoadingNext: true,
      selectedFolders: selectedFolders.concat([selectedFolderId]),
    });
    Promise.all([
      api.get(selectedFolder.foldersUrl, null, acceptHeader),
      api.get(selectedFolder.surveysUrl, null, acceptHeader),
    ]).then(([{ body: { folders } }, { body: { surveys } }]) => this.setState({
      isLoadingNext: false,
      folders: merge(this.state.folders, indexById(folders)),
      surveys: merge(this.state.surveys, indexById(surveys)),
    })).catch(() => {
      this.props.dispatch(showNotification('error', 'Failed to select folder.'));
    });
  }

  handleSurveySelection(selectedSurveyId) {
    const { surveys, surveyDefinitions } = this.state;
    this.setState({ selectedSurveyId, isLoadingForms: true });
    const surveyUrl = surveys[selectedSurveyId].surveyUrl;
    api.get(surveyUrl, null, acceptHeader)
      .then(({ body }) => this.setState({
        isLoadingForms: false,
        surveyDefinitions: merge(surveyDefinitions, {
          [body.id]: body,
        }),
      }))
      .catch(() => {
        this.props.dispatch(showNotification('error', 'Failed to select survey.'));
      });
  }

  handleFormSelection(selectedFormId) {
    const { surveyDefinitions, selectedSurveyId, instance } = this.state;
    const form = surveyDefinitions[selectedSurveyId].forms.find(f => f.id === selectedFormId);
    this.setState({ selectedFormId });
    this.props.onChange({
      kind: 'AKVO_FLOW',
      instance,
      surveyId: selectedSurveyId,
      formId: selectedFormId,
      version: 3,
    });
    this.props.onChangeSettings({ name: form.name });
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

  changeFolderSelection(evt, idx) {
    this.setState({
      selectedFolders: this.state.selectedFolders.slice(0, idx),
      selectedSurveyId: null,
      selectedFormId: null,
    }, () => this.handleSelection(evt));
  }

  render() {
    const {
      errorMessage,
      instance,
      selectedFolders,
      selectedSurveyId,
      selectedFormId,
      folders,
    } = this.state;

    const { formatMessage } = this.props.intl;

    const errorNotification = errorMessage != null && (
      <div>
        <span
          style={{
            color: 'red',
          }}
        >
          {errorMessage}
        </span>
      </div>
    );

    const folderSelections = selectedFolders.map((id, idx) => {
      const selectedFolder = folders[id];
      const parentId = selectedFolder.parentId;
      const options = this.foldersAndSurveysSelectionOptions(parentId);
      return (
        <Select
          key={idx}
          clearable={false}
          options={options}
          value={id}
          onChange={evt => this.changeFolderSelection(evt, idx)}
        />
      );
    });

    const lastSelectedFolderId = selectedFolders.length === 0 ?
      '0' : selectedFolders[selectedFolders.length - 1];

    // Either a survey or a folder can be selected
    const nextSelection = instance != null && errorMessage == null && (
      <Select
        placeholder={formatMessage({ id: 'select_survey_or_folder' })}
        isLoading={this.state.isLoadingNext}
        clearable={false}
        options={this.foldersAndSurveysSelectionOptions(lastSelectedFolderId)}
        value={selectedSurveyId}
        onChange={evt => this.handleSelection(evt)}
        data-test-id="survey-folder"
      />
    );

    const formSelection = selectedSurveyId != null && (
      <Select
        placeholder={formatMessage({ id: 'select_form' })}
        isLoading={this.state.isLoadingForms}
        clearable={false}
        options={this.formSelectionOptions(selectedSurveyId)}
        value={selectedFormId}
        onChange={evt => this.handleFormSelection(evt.value)}
        data-test-id="survey-folder"
      />
    );

    return (
      <div>
        <input
          placeholder={formatMessage({ id: 'flow_application_url' })}
          onChange={evt => this.handleFlowInstanceChange(evt.target.value)}
          type="text"
          style={{
            width: '100%',
            fontSize: '1rem',
            textAlign: 'center',
            padding: '0.25rem 0.75rem',
          }}
          data-test-id="flow-url"
        />
        {errorNotification}
        {folderSelections}
        {nextSelection}
        {formSelection}
      </div>
    );
  }
}

export default connect(state => ({
  flowApiUrl: state.env.flowApiUrl,
  email: state.profile.email,
}))(injectIntl(AkvoFlowDataSourceSettings));

AkvoFlowDataSourceSettings.propTypes = {
  intl: intlShape.isRequired,
  flowApiUrl: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  dataSource: PropTypes.shape({
    instance: PropTypes.string,
    surveyId: PropTypes.string,
    formId: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  onChangeSettings: PropTypes.func.isRequired,
};
