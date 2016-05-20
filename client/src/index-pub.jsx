import React from 'react';
import { render } from 'react-dom';
import DashMap from './components/charts/DashMap';

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;
render(<DashMap visualisation={data.visualisation} datasets={data.datasets} />, rootElement);
