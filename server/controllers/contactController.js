const Contact = require("../models/Contact");
const { logger } = require("../middleware/logger");

// @desc    Submit a contact form
// @route   POST /contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    console.log('Contact form submission received:', {
      body: req.body,
      headers: req.headers,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    const { name, email, subject, message } = req.body;

    // Check if Contact model is available
    if (!Contact) {
      console.error('Contact model is not available');
      return res.status(500).json({
        success: false,
        message: "Contact service is not available"
      });
    }

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Check for spam/duplicate submissions (same email + subject in last 5 minutes)
    const recentSubmission = await Contact.findOne({
      email: email.toLowerCase(),
      subject: subject.trim(),
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes ago
    });

    if (recentSubmission) {
      return res.status(429).json({
        success: false,
        message: "Please wait before submitting another message with the same subject"
      });
    }

    // Create contact submission
    const contactData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      language: req.get('Accept-Language')?.split(',')[0] || 'en',
      country: req.get('CF-IPCountry') || req.get('X-Country-Code') || null
    };

    console.log('Creating contact with data:', contactData);
    
    let contact;
    try {
      contact = await Contact.create(contactData);
      console.log('Contact created successfully:', contact._id);
    } catch (dbError) {
      console.error('Database error creating contact:', dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to save contact form. Please try again later."
      });
    }

    // Log the contact submission
    logger.info(`New contact form submission: ${contact._id}`, {
      contactId: contact._id,
      email: contact.email,
      subject: contact.subject,
      priority: contact.priority,
      ipAddress: contact.ipAddress
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
      data: {
        id: contact._id,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    logger.error("Error submitting contact form:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
};

// @desc    Get all contact submissions (Admin only)
// @route   GET /contact
// @access  Private (Admin)
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const priority = req.query.priority;
    const search = req.query.search;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('respondedBy', 'username email')
      .select('-__v');

    const total = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalContacts: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// @desc    Get contact by ID (Admin only)
// @route   GET /contact/:id
// @access  Private (Admin)
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('respondedBy', 'username email')
      .select('-__v');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    logger.error("Error fetching contact by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// @desc    Update contact status/response (Admin only)
// @route   PATCH /contact/:id
// @access  Private (Admin)
const updateContact = async (req, res) => {
  try {
    const { status, response, priority } = req.body;
    const contactId = req.params.id;
    const userId = req.user?.id;

    const updateData = {};
    if (status) updateData.status = status;
    if (response) updateData.response = response;
    if (priority) updateData.priority = priority;

    // If responding, set response details
    if (response) {
      updateData.respondedBy = userId;
      updateData.respondedAt = new Date();
      if (!status) updateData.status = 'in_progress';
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true, runValidators: true }
    ).populate('respondedBy', 'username email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    logger.info(`Contact updated: ${contactId}`, {
      contactId,
      updatedBy: userId,
      changes: updateData
    });

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact
    });

  } catch (error) {
    logger.error("Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// @desc    Delete contact (Admin only)
// @route   DELETE /contact/:id
// @access  Private (Admin)
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    logger.info(`Contact deleted: ${req.params.id}`, {
      contactId: req.params.id,
      deletedBy: req.user?.id
    });

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });

  } catch (error) {
    logger.error("Error deleting contact:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// @desc    Get contact statistics (Admin only)
// @route   GET /contact/stats
// @access  Private (Admin)
const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.getStats();
    
    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentStats = await Contact.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        recentSubmissions: recentStats
      }
    });

  } catch (error) {
    logger.error("Error fetching contact stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats
};
