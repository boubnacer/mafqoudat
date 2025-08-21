const express = require('express')
const router = express.Router()

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