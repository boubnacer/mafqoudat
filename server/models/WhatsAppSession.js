/**
 * WhatsApp session storage model.
 *
 * Baileys normally writes session credentials to the filesystem
 * (useMultiFileAuthState). On platforms with ephemeral filesystems – Render
 * free tier, Heroku, any container that starts fresh on each deploy – those
 * files are wiped on every restart, forcing a new QR scan every time.
 *
 * This model stores the same credential blobs in MongoDB instead, so the
 * session survives restarts and re-deploys regardless of the hosting plan.
 * One document per credential key (Baileys uses several: creds, keys/app-state-sync-version,
 * keys/session, etc.). The `session` field groups them so a single collection
 * can hold credentials for multiple WA numbers in future.
 */

'use strict';

const mongoose = require('mongoose');

const whatsAppSessionSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: true,
      default: 'default',
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'whatsapp_sessions',
  }
);

// One document per session + key combination.
whatsAppSessionSchema.index({ session: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('WhatsAppSession', whatsAppSessionSchema);
