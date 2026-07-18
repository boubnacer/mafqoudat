// Escapes RegExp metacharacters so a user- or API-supplied string can be used
// safely as a literal (still case-insensitive via the 'i' flag) match inside
// a MongoDB $regex query, instead of being interpreted as regex syntax.
const escapeRegex = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
