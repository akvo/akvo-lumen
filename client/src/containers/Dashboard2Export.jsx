import React, { Component } from 'react';
import { intlShape, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import BodyClassName from 'react-body-classname';
import _ from 'lodash';

import IntlWrapper from './IntlWrapper';
import PrintProvider from './PrintProvider';
import DashboardViewer from '../components/dashboard/DashboardViewer';
import configureStore from '../store/configureStore';
import * as api from '../utilities/api';

// https://github.com/mo/abortcontroller-polyfill/issues/10
const AbortController = window.AbortController;

class Dashboard2Export extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      immutableDatasets: {},
    };
    this.pendingRequests = [];
  }

  componentDidMount() {
    const { dashboardId } = this.props.routeParams;

    if (dashboardId != null) {
      const controller = new AbortController();
      const signal = controller.signal;
      this.pendingRequests.push(controller);

      api
        .get(`/api/dashboards/${dashboardId}/export`, {}, {}, signal)
        .then(({ body }) => {
          this.handleData(body);
        })
        .catch(() => {
          console.log('Yikes');
        })
        .finally(() => {
          this.pendingRequests = this.pendingRequests.filter(c => c !== controller);
        });
    }
  }

  handleData = (data) => {
    const datasets = data.datasets;
    const immutableDatasets = {};
    // Transform datasets into immutable objects
    if (datasets != null) {
      Object.keys(datasets).forEach((key) => {
        const dataset = Immutable.fromJS(datasets[key]);
        immutableDatasets[key] = dataset;
      });
    }
    this.setState({
      data,
      immutableDatasets,
    });
  }

  render() {
    const { data, immutableDatasets } = this.state;
    const { routeParams } = this.props;
    const title = _.get(data, ['dashboards', routeParams.dashboardId, 'title']);
    const exporting = true;
    return (
      <div>
        <BodyClassName className={'exporting'}>
          {data && (
            <div>
              <Provider store={configureStore()}>
                <PrintProvider>
                  <IntlWrapper>
                    <div className="">
                      <h1 className="export-header">{title}</h1>
                      <div className="viewer" style={{ display: 'flex' }}>
                        <DashboardViewer
                          dashboard={data.dashboards[data.dashboardId]}
                          visualisations={data.visualisations}
                          datasets={immutableDatasets}
                          metadata={data.metadata ? data.metadata : null}
                          exporting={exporting}
                        />
                      </div>
                    </div>
                  </IntlWrapper>
                </PrintProvider>
              </Provider>
            </div>
          )}
        </BodyClassName>
      </div>
    );
  }
}

Dashboard2Export.propTypes = {
  intl: intlShape,
  location: PropTypes.object.isRequired,
  routeParams: PropTypes.object.isRequired,
};

export default (injectIntl(Dashboard2Export));
