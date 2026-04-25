import path from 'path';

const notFound = (req, res, next) => {
    // For API routes — return JSON error
    if (req.originalUrl.startsWith('/api')) {
        const error = new Error(`Not Found - ${req.originalUrl}`);
        res.status(404);
        return next(error);
    }

    // For browser routes — serve the 404 HTML page
    const frontendPath = path.resolve('..', 'frontend');
    const page404 = path.join(frontendPath, '404.html');
    return res.status(404).sendFile(page404, (err) => {
        // If 404.html itself can't be found, fall through to JSON error
        if (err) {
            res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
        }
    });
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`[ErrorHandler]`, err);
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };
