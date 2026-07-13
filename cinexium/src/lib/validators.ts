export const isValidEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email);
};

export const isValidPassword = (password: string) => {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
};

export const isValidUsername = (username: string) => {
  const regex = /^(?=.{3,24}$)[a-z0-9_.]+$/;
  return regex.test(username);
};
