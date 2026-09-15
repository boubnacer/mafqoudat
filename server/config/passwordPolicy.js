/**
 * Password policy, enforced once here and read by everywhere a password can
 * be set.
 *
 * The model's `minlength` on User.password can never do this job: both write
 * paths (usersController's createNewUser/updateUser) call bcrypt.hash(password, 12)
 * before the value ever reaches the schema, so mongoose validates a
 * 60-character hash, not the password the user typed - the minimum can never
 * fail. And of the two routes that end at createNewUser, only /auth/register
 * ran the express-validator rule in middleware/validation.js; /users (what the
 * web client actually calls to register) ran none at all. So enforcement has
 * to live in the controllers themselves, before hashing - this is the one
 * place both that check and validation.js's express-validator rule read their
 * numbers from, so the two can never drift apart again.
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
// At least one lowercase letter, one uppercase letter, one digit.
const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/** Returns an error message describing what's wrong, or null if the password is fine. */
const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!PASSWORD_STRENGTH_REGEX.test(password)) {
    return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
  }
  return null;
};

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_STRENGTH_REGEX,
  validatePassword,
};
