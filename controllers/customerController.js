const db = require('../db');

const getCustomerById = async (req, res) => {
    const customerId = req.params.id;
   

    if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required.' });
    }

    try {
        const query = 'SELECT customer_id, name, email, phone_number, password FROM Customer WHERE customer_id = ?';

        const [results] = await db.query(query, [customerId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        res.status(200).json(results[0]);

    } catch (error) {
        console.error('Error fetching customer data:', error);
        res.status(500).json({ message: 'Internal server error fetching customer data.' });
    }
};

const updateCustomer = async (req, res) => {
    const customerId = req.params.id;
    const { email, phone, password } = req.body;


    if (!email || !phone || !password) { /* ... */ }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) { /* ... */ }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { /* ... */ }

    try {
        const checkConflictQuery = `SELECT customer_id FROM Customer WHERE (email = ? OR phone_number = ?) AND customer_id != ?`;
        const [conflictingUsers] = await db.query(checkConflictQuery, [email, phone, customerId]);

        if (conflictingUsers.length > 0) {
             const [currentUserData] = await db.query('SELECT email, phone_number FROM Customer WHERE customer_id = ?', [customerId]);
             let conflictField = 'Email or Phone number';
             if (currentUserData[0].email !== email) {
                 const [emailConflict] = await db.query('SELECT customer_id FROM Customer WHERE email = ? AND customer_id != ?', [email, customerId]);
                 if(emailConflict.length > 0) conflictField = 'Email';
             }
             if (currentUserData[0].phone_number !== phone) {
                 const [phoneConflict] = await db.query('SELECT customer_id FROM Customer WHERE phone_number = ? AND customer_id != ?', [phone, customerId]);
                 if (phoneConflict.length > 0) conflictField = (conflictField === 'Email' ? 'Email and Phone number' : 'Phone number');
             }
            return res.status(409).json({ message: `${conflictField} is already registered by another user.` });
        }

        const updateQuery = `UPDATE Customer SET email = ?, phone_number = ?, password = ? WHERE customer_id = ?`;
        const [updateResult] = await db.query(updateQuery, [email, phone, password, customerId]);

        if (updateResult.affectedRows === 0) { /* ... */ }

        console.log(`Customer details updated for ID: ${customerId}`);
        res.status(200).json({ message: 'Account details updated successfully!' });

    } catch (error) {
         console.error(`Error updating customer ${customerId}:`, error);
         if (error.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'Email or Phone number already exists for another user.' }); }
        res.status(500).json({ message: 'Internal server error during account update.' });
    }
};

module.exports = {
    getCustomerById,
    updateCustomer,
};
