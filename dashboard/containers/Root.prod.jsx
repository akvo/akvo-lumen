import React, { Component } from 'react';
import { Provider } from 'react-redux';
import DashApp from './DashApp';

export default class Root extends Component {
  render() {
    const { store } = this.props;
    return (
      <Provider store={store}>
        <DashApp />
      </Provider>
    );
  }
}
