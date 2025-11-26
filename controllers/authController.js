const db = require('../db');


const loginUser = async (req, res) => {
    const { name, password, role } = req.body;

    if (!name || !password || !role) {
        return res.status(400).json({ message: 'Name, password, and role are required.' });
    }

    let tableName = '';
    let idColumn = '';
    let nameColumn = 'name';
    let query = ''; 
    let columnsToSelect = '';

    switch (role.toLowerCase()) {
        case 'customer':
            tableName = 'Customer';
            idColumn = 'customer_id';
            columnsToSelect = `${idColumn}, name, password`; 
            break;
        case 'driver':
            tableName = 'Driver';
            idColumn = 'driver_id';
            columnsToSelect = `${idColumn}, name, password, is_active`;
            break;
        case 'admin':
            tableName = 'Admin';
            idColumn = 'admin_id';
            columnsToSelect = `${idColumn}, name, password`; 
            break;
        default:
            return res.status(400).json({ message: 'Invalid role specified.' });
    }

    query = `SELECT ${columnsToSelect} FROM ${tableName} WHERE ${nameColumn} = ?`;

    try {
        const [results] = await db.query(query, [name]);

        if (results.length === 0) {
            console.log(`Login failed for ${name} (${role}): Account does not exist.`);
            return res.status(401).json({ message: 'Invalid credentials or account does not exist.' });
        }

        const user = results[0];
        const storedPassword = user.password;

        if (role.toLowerCase() === 'driver' && user.is_active === 0) {
             console.log(`Login failed for driver ${name}: Account inactive.`);
             return res.status(403).json({ message: 'Account is inactive. Please contact administrator.' });
        }

        const passwordMatch = (password === storedPassword);

        if (passwordMatch) {
            console.log(`${role} login successful for: ${name}`);
            res.status(200).json({
                message: 'Login successful!',
                userId: user[idColumn],
                name: user.name,
                role: role.toLowerCase()
            });
        } else {
            console.log(`Login failed for ${name} (${role}): Incorrect password.`);
            return res.status(401).json({ message: 'Invalid credentials or account does not exist.' });
        }
    } catch (error) {
        console.error(`Login error for ${role} ${name}:`, error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
};


const registerCustomer = async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) { /* ... */ }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) { /* ... */ }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { /* ... */ }

    try {
        const checkUserQuery = 'SELECT customer_id, email, phone_number FROM Customer WHERE email = ? OR phone_number = ?';
        const [existingUsers] = await db.query(checkUserQuery, [email, phone]);

        if (existingUsers.length > 0) { }

        const insertQuery = 'INSERT INTO Customer (name, email, phone_number, password) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(insertQuery, [name, email, phone, password]);

        console.log(`New customer created with ID: ${result.insertId}`);
        res.status(201).json({ message: 'Customer account created successfully!', customerId: result.insertId });

    } catch (error) {
        console.error('Error registering customer:', error);
        if (error.code === 'ER_DUP_ENTRY') { /* ... */ }
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
};


module.exports = {
    loginUser,
    registerCustomer
};
