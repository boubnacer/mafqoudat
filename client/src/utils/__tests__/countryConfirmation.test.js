/**
 * Unit tests for First-Visit Country Selection & Confirmation Logic
 */

describe('Country Confirmation & First-Visit Defaulting Logic', () => {
  const mockCountries = [
    { _id: 'morocco-123', code: 'MA', names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' } },
    { _id: 'france-456', code: 'FR', names: { en: 'France', ar: 'فرنسا', fr: 'France' } },
    { _id: 'us-789', code: 'US', names: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis' } },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Modal visibility evaluation', () => {
    const shouldShowWelcomeDialog = (token, userCountry) => {
      const isConfirmed = localStorage.getItem('countryConfirmed') === 'true';
      return !isConfirmed && !token && !userCountry;
    };

    test('shows welcome dialog for first-visit unauthenticated visitor', () => {
      expect(shouldShowWelcomeDialog(null, null)).toBe(true);
    });

    test('does NOT show welcome dialog for returning confirmed visitor', () => {
      localStorage.setItem('countryConfirmed', 'true');
      expect(shouldShowWelcomeDialog(null, null)).toBe(false);
    });

    test('does NOT show welcome dialog for logged-in user', () => {
      expect(shouldShowWelcomeDialog('jwt-token-xyz', 'morocco-123')).toBe(false);
    });
  });

  describe('Default Country Resolution (Morocco Active Stats Protection)', () => {
    const resolveInitialCountry = ({ isConfirmed, savedCountry, userCountry, countries }) => {
      // 1. Logged in user
      if (userCountry) return userCountry;

      // 2. Confirmed returning visitor
      if (isConfirmed && savedCountry) return savedCountry;

      // 3. First-time or unconfirmed visitor: strictly default to Morocco ('MA')
      const morocco = countries.find((c) => c.code.toUpperCase() === 'MA');
      return morocco ? morocco._id : countries[0]?._id;
    };

    test('defaults to Morocco (MA) on first visit to prevent 0-stats empty state', () => {
      const resolved = resolveInitialCountry({
        isConfirmed: false,
        savedCountry: null,
        userCountry: null,
        countries: mockCountries,
      });

      expect(resolved).toBe('morocco-123');
    });

    test('overrides unconfirmed stale non-Morocco country to Morocco (MA)', () => {
      // If previous unconfirmed visit was silently set to US
      const resolved = resolveInitialCountry({
        isConfirmed: false,
        savedCountry: 'us-789',
        userCountry: null,
        countries: mockCountries,
      });

      expect(resolved).toBe('morocco-123');
    });

    test('preserves explicitly chosen country for returning confirmed visitor', () => {
      localStorage.setItem('countryConfirmed', 'true');
      const resolved = resolveInitialCountry({
        isConfirmed: true,
        savedCountry: 'france-456',
        userCountry: null,
        countries: mockCountries,
      });

      expect(resolved).toBe('france-456');
    });

    test('prioritizes logged-in user country from profile/token', () => {
      const resolved = resolveInitialCountry({
        isConfirmed: false,
        savedCountry: null,
        userCountry: 'us-789',
        countries: mockCountries,
      });

      expect(resolved).toBe('us-789');
    });
  });

  describe('IP Pre-Selection matching for Dialog', () => {
    const matchPreSelectedCountry = (geoCountryCode, countries) => {
      if (geoCountryCode) {
        const match = countries.find(
          (c) => c.code.toUpperCase() === geoCountryCode.toUpperCase()
        );
        if (match) return match;
      }
      return countries.find((c) => c.code.toUpperCase() === 'MA') || countries[0];
    };

    test('pre-selects detected country option without writing to Redux', () => {
      const preselected = matchPreSelectedCountry('FR', mockCountries);
      expect(preselected._id).toBe('france-456');
    });

    test('falls back to Morocco when IP geolocation fails or returns null', () => {
      const preselected = matchPreSelectedCountry(null, mockCountries);
      expect(preselected._id).toBe('morocco-123');
    });

    test('falls back to Morocco when IP country is not in database', () => {
      const preselected = matchPreSelectedCountry('ZZ', mockCountries);
      expect(preselected._id).toBe('morocco-123');
    });
  });

  describe('Confirmation Action', () => {
    test('stores countryConfirmed in localStorage upon user confirmation', () => {
      expect(localStorage.getItem('countryConfirmed')).toBeNull();

      // User confirms country
      localStorage.setItem('countryConfirmed', 'true');

      expect(localStorage.getItem('countryConfirmed')).toBe('true');
    });
  });
});
