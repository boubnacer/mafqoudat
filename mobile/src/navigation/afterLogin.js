/**
 * Where a completed sign-in lands.
 *
 * Login/SignUp/CountrySelection share a stack with Home (guest browsing - see
 * App.js), so isSignedIn flipping doesn't remount into a signed-in tree; the
 * destination has to be navigated to explicitly. A guest who was bounced to
 * Login mid-action (AuthContext's requireLogin stores the target) resumes what
 * they were doing instead of being dropped on Home - the protected screen is
 * still further down the same stack, so navigate() pops back to that existing
 * instance rather than pushing a second copy. Everyone else gets Home.
 *
 * Shared by every screen that can finish an authentication: LoginScreen
 * (password + OAuth sign-in) and CountrySelectionScreen (OAuth registration).
 */
export const navigateAfterLogin = (navigation, target) => {
  if (target?.screen) {
    navigation.navigate(target.screen, target.params);
    return;
  }
  navigation.navigate('Home');
};

export default navigateAfterLogin;
