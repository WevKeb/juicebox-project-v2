const {Client} = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev2');

// this function gets all users from the users table in the DB
const getAllUsers = async () => {
    try {
        const {rows} = await client.query(`
        SELECT * FROM users;
        `);

        // console.log(rows);
        return rows;
    } catch (error) {
        console.error('ERROR in getAllUsers');
        throw error
    }
};


// this function will create new user in the users table. we destructure username and password because we know that an object will be passed as a parameter wiht those values on it. we pull them off to use as parameters, to then pass as values into the dependency array, to then pass into the SQL query based on position in the array
// that SQL query then inserts that info in the users table in the respective username and password columns 
const createUser = async ({
    username, 
    password, 
    name, 
    location
}) => {
    try {
        const {rows: [newUser]} = await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *
        `, [username, password, name, location]);

        // console.log('this is newUser: ', newUser);
        return newUser;
    } catch (error) {
        console.error('ERROR in createUser')
        throw error
    }
};



// create a function to allow users to update their information (name, location, password, etc)

// try {
//     const {rows: updatedUser} = await client.query(`
//     UPDATE users
//     SET name = $1;
//        *** Need a string that says 'key = $1', 'key = $2', etc
//     `, [newname]);

const updateUser = async (id, fields = {}) => {
    const keys = Object.keys(fields);
    // ^^ this returns an array of the object (aka fields) key names
    // in this case, ['name', 'location'] which was passed in the object as paramter in updateUser in seed.js
    // console.log('this is keys ', keys);
    
    const setString = keys.map((key, index) => `${key} = $${index + 1}`);
    // ^^ here we map over the keys array, pull out each element (key name) and index as we go through. each time, we then create a string that makes the SET info for SQL, that *element/keyname = the position in dependency array which is index + 1* because index starts at 0, but SQL starts at 1 so need those to match
    // console.log(setString, 'this is setString');

    // console.log(Object.values(fields));
    // ^^ this returns array of the object (aka fields) value names
    // in this case, ['Kevin', 'River West'] which was passed in the object as parameter in updateUser in seed.js
    try {
        const {rows: [updatedUser]} = await client.query(`
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields));

        // console.log('this is updated user', updatedUser);
        return updatedUser;

    } catch (error) {
        console.error('ERROR in updateUser');
        throw error
    }
};



module.exports = {
    client,
    getAllUsers, 
    createUser, 
    updateUser
};