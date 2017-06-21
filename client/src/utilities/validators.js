const isValidEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,9})+$/;
  return regex.test(email);
};

export default { isValidEmail };
