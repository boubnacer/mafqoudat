const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: function() {
      // Password is only required for local authentication
      return !this.authProvider || this.authProvider === 'local';
    },
    minlength: 6
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    unique: true,
    sparse: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Country",
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    // New multilingual firstName field
    firstNameLabels: {
      en: {
        type: String,
        trim: true
      },
      fr: {
        type: String,
        trim: true
      },
      ar: {
        type: String,
        trim: true
      }
    },
    // New multilingual lastName field
    lastNameLabels: {
      en: {
        type: String,
        trim: true
      },
      fr: {
        type: String,
        trim: true
      },
      ar: {
        type: String,
        trim: true
      }
    },
    avatar: {
      type: String,
      default: null
    }
  },
  ipAddress: {
    type: String,
    default: null
  },
  // Users this user has blocked. Google Play's user-generated-content policy
  // requires a way to block another user, not only to report their content:
  // reporting asks us to act, blocking lets the user act for themselves and
  // takes effect immediately.
  //
  // Deliberately one-directional and read-time only. Blocking hides the blocked
  // user's posts and match alerts from the blocker (see utils/blockedUsers.js
  // and its callers); it does not hide the blocker from the blocked user, and
  // it destroys nothing, so unblocking restores the previous view exactly.
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Controls the lost/found match alerts produced by services/matchingService.js.
  // Every field has a default, so users created before this block existed
  // behave exactly like a user who never touched the settings.
  notificationPreferences: {
    // Master switch for in-app match alerts.
    matchAlerts: {
      type: Boolean,
      default: true
    },
    // Opt-in email copy of a match alert. Off by default: an unsolicited email
    // is a very different thing from a badge on a bell icon.
    emailAlerts: {
      type: Boolean,
      default: false
    },
    // Device push notifications for the mobile app (services/pushNotificationService.js).
    // On by default, unlike email: the OS already gatekeeps this one behind its
    // own permission prompt, so a user who granted that has opted in already,
    // and a user who denied it never receives anything regardless of this flag.
    // Subordinate to matchAlerts - turning the master switch off stops pushes too.
    pushAlerts: {
      type: Boolean,
      default: true
    },
    // Confidence floor, 0-100. Raising it makes alerts rarer and stronger.
    minScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    // Master switch for "someone commented on your post" alerts (in-app and
    // push both - there is no separate email copy of these, unlike matches).
    // Independent of matchAlerts/pushAlerts, which only ever gate match leads.
    commentAlerts: {
      type: Boolean,
      default: true
    },
    // Master switch for "your listing is now on our Facebook page / Instagram
    // account" alerts (in-app and push, no email copy). Independent of the two
    // above: this one reports on something the platform itself did with the
    // user's listing, not on someone else's activity.
    socialAlerts: {
      type: Boolean,
      default: true
    }
  },
  // Expo push tokens for this user's devices, newest last.
  //
  // Per-device rather than per-user: one account is routinely signed in on a
  // phone and a tablet, and a token identifies an app installation, not a
  // person. `language` is stored alongside because a push is server-initiated -
  // unlike the inbox, which localizes from the `language` query param of the
  // request that asked for it, there is no request here to read it from.
  //
  // A token can migrate between accounts (shared device, sign out then sign in
  // as someone else), so registration removes it from every other user first -
  // see notificationsController.registerPushToken. Dead tokens are pruned by
  // pushNotificationService when Expo reports DeviceNotRegistered.
  pushTokens: [{
    token: {
      type: String,
      required: true,
      trim: true
    },
    platform: {
      type: String,
      enum: ['android', 'ios'],
      required: true
    },
    language: {
      type: String,
      enum: ['en', 'fr', 'ar'],
      default: 'en'
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Web Push subscriptions for this user's browsers, newest last.
  //
  // The browser twin of `pushTokens` above, and deliberately a separate array
  // rather than another `platform` value on that one: a Web Push subscription
  // is not a token but an endpoint URL plus two encryption keys, delivered by
  // whatever push service the browser belongs to (FCM for Chrome, Mozilla's
  // for Firefox, Apple's for Safari) and sent to with a completely different
  // protocol than Expo's.
  //
  // Same per-device reasoning, same stored `language` (a push is composed
  // server-side, with no request to read a language from), and the same
  // migration problem: a shared computer can carry one browser subscription
  // across two accounts, so registration clears the endpoint from every other
  // user first. Dead subscriptions are pruned by webPushService when the push
  // service answers 404/410.
  webPushSubscriptions: [{
    // The push service's URL for this browser. Unique per browser profile, and
    // what identifies the subscription everywhere else.
    endpoint: {
      type: String,
      required: true,
      trim: true
    },
    // The browser's own public key and auth secret, used to encrypt each
    // payload so the push service in the middle cannot read it.
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['en', 'fr', 'ar'],
      default: 'en'
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Optimized indexes for efficient queries
// Authentication fields (username/email/phone/googleId/facebookId) already
// declare their index via `unique`/`sparse` on the path itself above -
// redeclaring them here via schema.index() duplicated those indexes.

// 2. User management indexes
// blockedUsers is read on nearly every listing request for a signed-in viewer,
// and swept once per account deletion ("who blocked this user?").
userSchema.index({ blockedUsers: 1 });
// Push token registration looks a token up across all users ("which account is
// this device signed into?") and pruning a dead token does the same, so the
// array's token field is the lookup key on both paths.
userSchema.index({ "pushTokens.token": 1 });
// The browser twin, and needed for the same two lookups: registration asks
// "which account already holds this endpoint?" across every user, and pruning
// a subscription the push service reported gone does the same. Without it both
// are a full collection scan - and the pruning one runs inside the send loop.
userSchema.index({ "webPushSubscriptions.endpoint": 1 });
userSchema.index({ country: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ country: 1, role: 1, isActive: 1 });

// Index for multilingual search
userSchema.index({ 
  "profile.firstNameLabels.en": "text", 
  "profile.firstNameLabels.fr": "text", 
  "profile.firstNameLabels.ar": "text",
  "profile.lastNameLabels.en": "text", 
  "profile.lastNameLabels.fr": "text", 
  "profile.lastNameLabels.ar": "text",
  "username": "text"
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  const firstName = this.profile.firstName || this.profile.firstNameLabels?.en || '';
  const lastName = this.profile.lastName || this.profile.lastNameLabels?.en || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return this.username;
});

// Method to get firstName by language
userSchema.methods.getFirstName = function(language = 'en') {
  return this.profile.firstNameLabels?.[language] || 
         this.profile.firstNameLabels?.en || 
         this.profile.firstName || '';
};

// Method to get lastName by language
userSchema.methods.getLastName = function(language = 'en') {
  return this.profile.lastNameLabels?.[language] || 
         this.profile.lastNameLabels?.en || 
         this.profile.lastName || '';
};

// Method to get full name by language
userSchema.methods.getFullName = function(language = 'en') {
  const firstName = this.getFirstName(language);
  const lastName = this.getLastName(language);
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return this.username;
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Method to check if user is moderator or admin
userSchema.methods.isModerator = function() {
  return this.role === 'moderator' || this.role === 'admin';
};

module.exports = mongoose.model("User", userSchema);
