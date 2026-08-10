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
    // Confidence floor, 0-100. Raising it makes alerts rarer and stronger.
    minScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Optimized indexes for efficient queries
// 1. Authentication indexes (most critical)
userSchema.index({ username: 1 });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true, unique: true });
userSchema.index({ facebookId: 1 }, { sparse: true, unique: true });

// 2. User management indexes
// blockedUsers is read on nearly every listing request for a signed-in viewer,
// and swept once per account deletion ("who blocked this user?").
userSchema.index({ blockedUsers: 1 });
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
