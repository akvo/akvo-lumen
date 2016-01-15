import React, { Component, PropTypes } from 'react';
import DatasetGraph from './DatasetGraph'

export default class DatasetItem extends Component {
  render() {
    return (
      <div>
      	<span>{this.props.set.name}</span>
      	<span> ({this.getVisualisationCountForSet()} visualisations) </span>
      	<span onClick= {() => this.toggleVisualisationModal()}
      	style={{
      		cursor: 'pointer'
      	}}>[+]</span>
      	{this.props.activeVisualisationModal === this.props.datasetId && 
      		<VisualisationModal
      			datasetId={this.props.datasetId}
      			saveVisualisation={this.props.saveVisualisation}
      			toggleVisualisationModal={this.props.toggleVisualisationModal}
      			datasets={this.props.datasets}
      			defaultChartType='Bar'
  			/>
      	}
      </div>
    )
  }

  getVisualisationCountForSet() {
  	let count = 0;

  	this.props.visualisations.all.map((item) => {
  		if (parseInt(item.datasetId) === parseInt(this.props.datasetId)) {
  			++count;
  		}
  	});

  	return count;
  }

  toggleVisualisationModal(e) {
  	this.props.toggleVisualisationModal(this.props.datasetId);
  }

  closeModal() {
  	return function() {this.setState({visualisationModalIsOpen: false})};
  }

}

class VisualisationModal extends Component {

	constructor(props) {
		super(props);
		this.state = {type: props.defaultChartType};
	}	
	render() {
		return (
			<div style={{
				backgroundColor: 'whitesmoke',
				padding: '1em'
			}}>
				<div>
					<label htmlFor={'vName' + this.props.datasetId}>Visualisation name:</label>
					<input id={'vName' + this.props.datasetId} type="text" ref='vName'/>
				</div>
				<div>
					<label htmlFor={'vType' + this.props.datasetId}>Visualisation type:</label>
					<select id={'vType' + this.props.datasetId} ref='vType' defaultValue={this.props.defaultChartType} onChange={() => this.onTypeChange()}>	
						<option value="Bar">Bar</option>
						<option value="Pie">Pie</option>
						<option value="Donut">Donut</option>
					</select>		
				</div>
				<div>
					<DatasetGraph
						datasetId={this.props.datasetId}
						datasets={this.props.datasets}
		      			graphWidth={250}
      					graphHeight={250}
      					labelOffset={-5}
      					labelDirection="default"
      					type={this.getType()}
					/>
				</div>
				<div>
					<button onClick={
						() => this.cancel()
					}>
						Cancel
					</button>
					<button onClick={
						() => this.saveVisualisation()
					}>
						Save visualisation
					</button>
				</div>
			</div>
		)
	}

	cancel() {
		this.props.toggleVisualisationModal(this.props.datasetId);
	}

	saveVisualisation() {
	    const nameNode = this.refs.vName;
	    const vName = nameNode.value.trim();

	    const typeNode = this.refs.vType;
	    const vType = typeNode.value.trim();

	    nameNode.value = '';
	    typeNode.value = '';

		let data = {
			datasetId: this.props.datasetId,
			name: vName,
			type: vType
		}
		this.props.saveVisualisation(data);

		// After saving the visualisation, remove the modal
		this.cancel();
	}

	onTypeChange(e) {
		const typeNode = this.refs.vType;
		const type = typeNode.value.trim();

		this.setState({type: type});
	}

	getType() {
		return this.state.type;
	}
}