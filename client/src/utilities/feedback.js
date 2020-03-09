/* eslint-disable no-undef, no-use-before-define, no-underscore-dangle */

let feedbackInited;

export const init = (state) => {
  if (feedbackInited || !state.profile) {
    return;
  }
  feedbackInited = true;
  window.bugyard('setUser', {
    email: 'devops@akvo.org',
    id: state.profile.sub || 'Unknown',
  });
};

export default { init };
