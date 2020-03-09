/* eslint-disable no-undef, no-use-before-define, no-underscore-dangle */


export const init = (state) => {
  if (!state || !state.profile) {
    return;
  }
  window.bugyard('setUser', {
    email: 'devops@akvo.org',
    name: state.profile.sub || 'Unknown',
    id: state.profile.sub || 'Unknown',
  });
};

export default { init };
