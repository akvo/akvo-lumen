import introJs from 'intro.js';

const initIntro = (onExit, onComplete, options) => {
  const intro = introJs();

  intro.onbeforechange(() => {
    const currentStepIdx = intro._currentStep;
    const currentStepDynamic = !!intro._options.steps[currentStepIdx].dynamic;

    if (currentStepDynamic) {
      const step = intro._options.steps[currentStepIdx];
      const element = document.querySelector(step.element);

      if (element) {
        const introItem = intro._introItems[currentStepIdx];
        introItem.element = element;
        introItem.position = step.position;
      }
    }
  });

  intro.onexit(() => {
    onExit();
  });

  intro.oncomplete(() => {
    onComplete();
  });

  intro.setOptions(options);
  return intro;

};
export default initIntro;
