import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { intlShape, injectIntl } from 'react-intl';


class Dashboard2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dashboard: {
        type: 'dashboard',
        title: props.intl.formatMessage({ id: 'untitled_dashboard' }),
        entities: {},
        layout: [],
      },
    };
  }

  render() {
    return (
      <h1>Dashboard2</h1>
    );
  }
}

Dashboard2.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: intlShape,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(injectIntl(Dashboard2));
