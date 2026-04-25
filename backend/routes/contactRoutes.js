import express from 'express';
const router = express.Router();

// @desc    Submit contact us form
// @route   POST /api/contact
// @access  Public
router.post('/', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    // In a production app, this would save to the database or send an email.
    // For now, we mock a successful submission.
    console.log(`Contact message received from ${name} (${email}): ${subject}`);

    res.json({ message: 'Thank you! Your message has been received and we will get back to you shortly.' });
});

export default router;
