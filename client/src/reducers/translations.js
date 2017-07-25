import { handleActions } from 'redux-actions';
import * as translations from '../actions/translations';

const initialState = {
  language: window.localStorage.getItem('lumen:language') || 'en',
};

function setLanguage(state, { payload }) {
  window.localStorage.setItem('lumen:language', payload);
  return { language: payload };
}

export default handleActions({
  [translations.setLanguage]: setLanguage,
}, initialState);
