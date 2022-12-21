const {Client} = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev2');

// this function gets all users from the users table 
const getAllUsers = async () => {
    try {
        const {rows} = await client.query(`
        SELECT * FROM users;
        `);

        // console.log(rows);
        return rows;
    } catch (error) {
        console.error('ERROR in getAllUsers');
    }
};

// this function will create new user in the users table 
const createUser = async ({username, password}) => {
    try {
        const {rows: [newUser]} = await client.query(`
        INSERT INTO users(username, password)
        VALUES ($1, $2)
        ON CONFLICT (username) DO NOTHING
        RETURNING *
        `, [username, password]);

        console.log('this is newUser: ', newUser);
        return newUser;
    } catch (error) {
        console.error('ERROR in createUser')
        throw error
    }
};

module.exports = {
    client,
    getAllUsers, 
    createUser
};