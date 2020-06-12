import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SAVE_COUNTDOWN_INTERVAL, SAVE_INITIAL_TIMEOUT } from '../../constants/time';

export default function PendingSaving(props) {
  const isMountedFlag = useRef(false);

  const [isUnsavedChanges, setIsUnsavedChanges] = useState(false);

  const [timeToNextSave, setTimeToNextSave] = useState(SAVE_INITIAL_TIMEOUT);

  const [timeFromPreviousSave, setTimeFromPreviousSave] = useState(0);

  const [savingFailed, setSavingFailed] = useState(false);

  const handleSaveFailure = () => {
    setTimeToNextSave(x => x * 2);
    setTimeFromPreviousSave(0);
    setSavingFailed(true);
  };

  const handleSaveOnError = (error) => {
    if (!isMountedFlag.current) return;
    if (error) {
      handleSaveFailure();
      return;
    }
    setIsUnsavedChanges(false);
    setTimeToNextSave(SAVE_INITIAL_TIMEOUT);
    setTimeToNextSave(0);
    setSavingFailed(false);
  };

  const onBeginEdit = () => setIsUnsavedChanges(true);

  useEffect(() => {
    isMountedFlag.current = true;
    return () => {
      isMountedFlag.current = false;
    };
  }, []);


  useEffect(() => {
    if (savingFailed) {
      const saveInterval = setInterval(() => {
        if (timeToNextSave - timeFromPreviousSave > SAVE_COUNTDOWN_INTERVAL) {
          setTimeFromPreviousSave(x => x + SAVE_COUNTDOWN_INTERVAL);
          return;
        }
        clearInterval(saveInterval);
      }, SAVE_COUNTDOWN_INTERVAL);
      setTimeout(() => {
        props.handleSave(handleSaveOnError);
      }, timeToNextSave);
    }
  }, [savingFailed]);

  return { savingFailed, isUnsavedChanges, timeToNextSave, onBeginEdit };
}

PendingSaving.propTypes = {
  handleSave: PropTypes.func.isRequired,
};

