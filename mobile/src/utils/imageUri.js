/**
 * Resolves a post/user image field (a full URL, or a path relative to the
 * API) to a URI an <Image> can load. Was copy-pasted verbatim into nine
 * screens/components - one place to fix if the storage backend or URL shape
 * ever changes.
 */

import { API_BASE_URL } from '../config/api';

export const getImageUri = (image) =>
  image ? (image.startsWith('http') ? image : `${API_BASE_URL}/${image}`) : null;
