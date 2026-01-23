module.exports = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    console.error('Error Handler:', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });

    switch (err.name) {
        case 'SequelizeValidationError':
        case 'SequelizeUniqueConstraintError':
            statusCode = 400;
            message = err.errors.map(e => e.message).join(', ');
            break;

        case 'BadRequest':
            statusCode = 400;
            message = err.message || 'Bad Request';
            break;

        case 'Unauthorized':
        case 'JsonWebTokenError':
            statusCode = 401;
            message = err.message || 'Unauthorized';
            break;

        case 'Forbidden':
            statusCode = 403;
            message = err.message || 'Forbidden';
            break;

        case 'NotFound':
            statusCode = 404;
            message = err.message || 'Not Found';
            break;

        // ✅ Tambahkan case untuk Multer errors
        case 'MulterError':
            statusCode = 400;
            if (err.code === 'LIMIT_FILE_SIZE') {
                message = 'File too large. Maximum size is 5MB';
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                message = 'Unexpected field';
            } else {
                message = err.message;
            }
            break;

        default:
            // ✅ Log error untuk debugging
            console.error('Unhandled error:', err);
            statusCode = 500;
            message = err.message || 'Internal Server Error';
    }

    res.status(statusCode).json({ message });
};