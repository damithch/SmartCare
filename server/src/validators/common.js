const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export const isValidEmail = (email) => EMAIL_REGEX.test(email);
export const isValidPassword = (password) => PASSWORD_REGEX.test(password);

export const parsePositiveInt = (value, fallback) => {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};
