/**
 * Root navigation ref, so code outside the React tree (AuthContext's signOut)
 * can drive navigation imperatively - e.g. resetting to Login after a manual
 * sign-out, without waiting on/depending on a navigator remount.
 */
import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const resetToLogin = () => {
  if (navigationRef.isReady() && navigationRef.getRootState()?.routeNames?.includes('Login')) {
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  }
};
