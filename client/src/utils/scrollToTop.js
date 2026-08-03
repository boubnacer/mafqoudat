// Resets scroll to the top of the page. Needed because React Router doesn't
// do this on navigation, and because on /dash/* routes the real scroll
// container isn't window/body/html at all - see the id comment in
// DashLayout.js for why overflowX: 'hidden' there makes that Box the actual
// (and only) scrolling element. Direct scrollTop assignment (not
// window.scrollTo) is used for the instant case so the jump can't be
// animated: index.css sets html { scroll-behavior: smooth }, and per spec
// scrollTo's 'auto' behavior defers to that CSS property instead of
// overriding it.
const scrollToTop = () => {
  const dashScrollContainer = document.getElementById('dash-scroll-container');
  if (dashScrollContainer) dashScrollContainer.scrollTop = 0;

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

// Same target resolution as scrollToTop, but animated - for in-page
// transitions (e.g. wizard step changes) where a smooth scroll reads better
// than a hard jump.
export const smoothScrollToTop = () => {
  const dashScrollContainer = document.getElementById('dash-scroll-container');
  if (dashScrollContainer) {
    dashScrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

export default scrollToTop;
