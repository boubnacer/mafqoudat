const { logEvents } = require('./logger')

const errorHandler = (err, req, res, next) => {
    logEvents(`${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
    console.error(err.stack)

    // res.statusCode defaults to 200 in Express even before res.status() is
    // called, so a plain truthy check would use 200 for any error thrown
    // before the handler set a 4xx/5xx status. Only trust a status that was
    // explicitly set (i.e., not the 200 default).
    const status = (res.statusCode && res.statusCode !== 200) ? res.statusCode : 500

    res.status(status)

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return res.json({
            message: 'Validation Error',
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
        message: 'Internal Server Error',
        isError: true
    })
}

module.exports = errorHandler 