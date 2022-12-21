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
        console.error('ERROR in getAllUsers', error);
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
        console.error('ERROR in createUser', error)
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
        console.error('ERROR in updateUser', error);
        throw error
    }
};


const getUserById = async (userId) => {
    const {rows: [user]} = await client.query(`
    SELECT * from users
    WHERE id = $1;
    `, [userId]);

    user.posts = await getPostsByUser(userId);
    // console.log('user inside getUserById', user);
    return user;
}


// ***************** Below is all Posts functions *********************

const createPost = async (
    {authorId,
    title, 
    content}
    // createPost by destructuring the object that was passed as parameter with the valuee we need to passinto the dependency array to be used in our SQL query 
) => {
    try {
        const {rows: [newPost]} = await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `, [authorId, title, content]);

        // console.log('this is the newPost', newPost);
        return newPost;
    } catch (error) {
        console.error('ERROR in createPost', error)
        throw error;
    }
};

const getAllPosts = async () => {
    try {
        const {rows: allPosts} = await client.query(`
        SELECT * FROM posts;
        `)

        // console.log('this is allPosts', allPosts);
        return allPosts;
    } catch (error) {
        console.error('ERROR in getAllPosts', error)
        throw error;
    }
};

// gonna get object with title and content on it
const updatePost = async (id, fields = {}) => {
    const keys = Object.keys(fields); 
    
    const setString = keys.map((key, index) => `${key} = $${index + 1}`);
    try {
        const {rows: updatedPost} = await client.query(`
        UPDATE posts
        SET ${setString}
        WHERE id = ${id}
        RETURNING *;
        `, Object.values(fields));

        // console.log(updatedPost);
        return updatedPost;
    } catch (error) {
        console.error('ERROR in getUpdatePsts', error)
        throw error
    }
};

const getPostsByUser = async (userId) => {
    try { 
        const {rows: postsByUser} = await client.query (`
        SELECT * FROM posts
        WHERE id = $1;
        `, [userId]);

        return postsByUser;
    } catch (error) {
        console.error('ERROR in getPostsByUser', error)
        throw error
    }
};


module.exports = {
    client,
    getAllUsers, 
    createUser, 
    updateUser,
    createPost, 
    getAllPosts,
    updatePost, 
    getPostsByUser,
    getUserById
};