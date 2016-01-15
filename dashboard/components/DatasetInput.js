import React, { Component, PropTypes } from 'react';

export default class DatasetInput extends Component { 

  constructor(props) {
    super(props);
    this.state = { inputActive: false }
  }

  render() {
    const awaitingPress = <div className='dataset-button'>
                            <button onClick = {e => this.setState({inputActive: true})
                            }>Add a new dataset</button>
                          </div>

    const awaitingInput = <div className='dataset-input'>
                            <input style={{width: '30em'}} type='url' ref='datasetURL' placeholder='Enter the URL for the data you want to fetch' />
                            <button onClick = {e => this.handleSubmit(e)}>Submit</button>
                          </div>

    const awaitingName = <div className='dataset-name-input'>
                            <input type='text' ref='datasetName' placeholder='Please name your dataset' />
                          <button onClick = {e => this.handleDatasetNameInput(e)}>Save name</button>
                        </div>

    let markup;

    if (this.state.inputActive) {
      markup = this.props.datasets.waitingForDatasetName ? awaitingName : awaitingInput
    } else {
      markup = awaitingPress;
    }

    return (
      <div>
        {markup}
      </div>
    )
  }

  handleSubmit(e) {
    const node = this.refs.datasetURL;
    const text = node.value.trim();
    this.props.onSubmit(text);
    node.value = '';
  }    

  handleDatasetNameInput(e) {
    const node = this.refs.datasetName;
    const text = node.value.trim();
    this.props.onSubmitDatasetName(text);
    this.setState({inputActive: false});
    node.value = '';
  }
}