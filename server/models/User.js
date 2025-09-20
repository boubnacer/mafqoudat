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
    required: true,
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
  }
}, {
  timestamps: true
});

// Optimized indexes for efficient queries
// 1. Authentication indexes (most critical)
userSchema.index({ username: 1 });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ phone: 1 }, { sparse: true });

// 2. User management indexes
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
