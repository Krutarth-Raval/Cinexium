export const isValidEmail = (email: string) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

export const isValidPassword = (password: string) => {
  return password.length >= 8;
};

export const isValidUsername = (username: string) => {
  const regex = /^[a-z0-9_\.]+$/;
  return regex.test(username);
};
