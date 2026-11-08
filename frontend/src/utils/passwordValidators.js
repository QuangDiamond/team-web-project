import { validateConfirmPassword, validatePassword } from './authValidators';

export const validateNewPassword = (values) => ({
  new_password: validatePassword(values.new_password),
  confirm_password: validateConfirmPassword(values.new_password, values.confirm_password),
});
