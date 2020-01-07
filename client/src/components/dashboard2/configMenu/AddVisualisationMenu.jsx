import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'react-intl';

import * as api from '../../../utilities/api';
import { getIconUrl } from '../../../domain/entity';

require('../../dashboard/DashboardVisualisationList.scss');

// https://github.com/mo/abortcontroller-polyfill/issues/10
const AbortController = window.AbortController;

class AddVisualisationMenu extends Component {

  constructor(props) {
    super(props);
    this.state = {
      limit: 1,
      offset: 0,
      visualisations: [],
    };
    this.pendingRequests = [];
  }

  componentDidMount() {
    this.getItems();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.offset !== prevState.offset) {
      this.getItems();
    }
  }

  componentWillUnmount() {
    this.pendingRequests.map(controller => controller.abort());
  }

  onNextOffset = () => {
    this.setState(prevState => ({
      offset: prevState.offset + prevState.limit,
    }));
  }

  onPreviousOffset = () => {
    this.setState(prevState => ({
      offset: prevState.offset - prevState.limit,
    }));
  }

  getItems = () => {
    const { limit, offset } = this.state;

    const controller = new AbortController();
    const signal = controller.signal;
    this.pendingRequests.push(controller);
    api
      .get('/api/visualisations', { limit, offset }, {}, signal)
      .then(({ body }) => {
        this.setState({ visualisations: body });
      })
      .catch(() => {
        console.log('yikes');
      })
      .finally(() => {
        this.pendingRequests = this.pendingRequests.filter(c => c !== controller);
      });
  }

  render() {
    const { offset, visualisations } = this.state;
    return (
      <div
        className="DashboardVisualisationList"
      >
        {visualisations.length === 0 ?
          <div>
            <button onClick={this.onBackOffset}>Back</button>
            <br />
            <FormattedMessage id="no_visualisations_to_show" />
          </div>
        :
          <div>
            {offset !== 0 && <button onClick={this.onPrevious}>Previous</button> }
            <button onClick={this.onNextOffset}>Next</button>
            <ul>
              {visualisations.map((item) => {
                return (
                  <li
                    className="listItem clickable"
                    data-test-name={item.name}
                    key={item.id}
                  >
                    <h4>{item.name}</h4>
                  </li>
                );
              })}
            </ul>
          </div>
          }
      </div>
    );
  }
}

AddVisualisationMenu.propTypes = {
  intl: intlShape,
  onAddVisualisation: PropTypes.func.isRequired,
};

export default AddVisualisationMenu;
