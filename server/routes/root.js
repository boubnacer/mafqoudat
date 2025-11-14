const express = require('express')
const router = express.Router()
const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

// Simple endpoint to get/sync visitor session ID
// This is called by the frontend to ensure session ID is in sync
router.get('/visitor-session', async (req, res) => {
  try {
    // Get session ID from header (preferred) or cookie (fallback)
    let sessionId = req.get('X-Visitor-Session') ||
                    req.headers['x-visitor-session'] ||
                    req.cookies?.visitorSession;

    // If no session ID, create a new one
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Check if this session was already counted
    const existingVisit = await Visitor.findOne({ sessionId });

    // Return session ID in response header
    res.setHeader('X-Visitor-Session', sessionId);
    
    // Also set cookie as fallback
    res.cookie('visitorSession', sessionId, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/'
    });

    res.json({
      success: true,
      sessionId: sessionId,
      isNewSession: !existingVisit
    });
  } catch (error) {
    console.error('Error in visitor-session endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting visitor session'
    });
  }
});

router.get('^/$|/index(.html)?', (req, res) => {
    res.json({
        message: "Mafqoudat API Server",
        status: "Running",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        endpoints: {
            health: "/health",
            auth: "/auth",
            users: "/users",
            posts: "/posts",
            countries: "/countries",
            categories: "/categories",
            dependencies: "/dependencies",
          
        },
        documentation: "This is the backend API server. Frontend is deployed separately."
    })
})

module.exports = router