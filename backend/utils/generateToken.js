import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    // 7 days: balance between UX and security.
    // TODO: Implement refresh tokens for longer sessions without long-lived access tokens.
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

export default generateToken;
