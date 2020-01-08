import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'react-intl';
import { getDataLastUpdated } from '../../../utilities/chart';
import * as api from '../../../utilities/api';
import { getIconUrl, getAuthor } from '../../../domain/entity';
import SelectMenu from '../../common/SelectMenu';

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
      selectVisualisationValue: null,
    };
    this.pendingRequests = [];
    this.onChangeSelectVis = this.onChangeSelectVis.bind(this);
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
  onChangeSelectVis = selectVisualisationValue => this.setState({ selectVisualisationValue })

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
    const { dashboard, library } = this.props;

    const isOnDashboard = item => Boolean(dashboard.entities[item.id]);

    return (
      <div className="DashboardVisualisationList">
        <div className="inputGroup">
          <label htmlFor="columnName">
            <FormattedMessage id="select_a_visualisation" />
          </label>
          <SelectMenu
            name="visualisation"
            value={this.state.selectVisualisationValue}
            onChange={this.onChangeSelectVis}
            options={Object.values(library.visualisations).map(v => ({ value: v.id, label: v.name }))}
          />
        </div>
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
            <ul className="list">
              {visualisations.map((i) => { const h = i; h.type = 'visualisation'; return h; }).map((item) => {
                console.log('item', item);
                const dataLastUpdated = getDataLastUpdated({
                  visualisation: item,
                  datasets: library.datasets,
                });
                return (
                  <li
                    className={`listItem clickable  ${item.visualisationType.replace(' ', '')} `}
                    data-test-name={item.name}
                    key={item.id}
                  >
                    <div className="entityIcon">
                      <img src={getIconUrl(item)} role="presentation" />
                    </div>
                    <div className="textContent">
                      <h3>
                        {item.name}
                        <span
                          className="isOnDashboardIndicator"
                        >
                          {isOnDashboard(item) ? '✔' : ''}
                        </span>
                      </h3>
                      {dataLastUpdated && (
                        <div className="lastModified">
                         {getAuthor(item)} - {dataLastUpdated}
                        </div>
                      )}

                    </div>
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
  dashboard: PropTypes.object.isRequired,
  library: PropTypes.object,
};

export default AddVisualisationMenu;
