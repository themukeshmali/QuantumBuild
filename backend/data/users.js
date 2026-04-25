import bcrypt from 'bcryptjs';

const users = [
    {
        name: 'Admin User',
        email: 'admin@quantumbuild.com',
        password: bcrypt.hashSync('admin123', 10),
        isAdmin: true,
    },
    {
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        password: bcrypt.hashSync('user123', 10),
        isAdmin: false,
    },
    {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: bcrypt.hashSync('user123', 10),
        isAdmin: false,
    },
];

export default users;
