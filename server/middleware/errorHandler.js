const { logEvents } = require('./logger')

const errorHandler = (err, req, res, next) => {
    logEvents(`${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
    console.log(err.stack)

    const status = res.statusCode ? res.statusCode : 500 // server error 

    res.status(status)

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return res.json({ 
            message: 'Validation Error', 
            details: err.message,
            isError: true 
        });
    }

    if (err.name === 'CastError') {
        return res.json({ 
            message: 'Invalid ID format', 
            isError: true 
        });
    }

    if (err.code === 11000) {
        return res.json({ 
            message: 'Duplicate field value', 
            isError: true 
        });
    }

    if (err.name === 'MulterError') {
        return res.json({ 
            message: err.message, 
            isError: true 
        });
    }

    res.json({ 
        message: err.message || 'Internal Server Error', 
        isError: true 
    })
}

module.exports = errorHandler 