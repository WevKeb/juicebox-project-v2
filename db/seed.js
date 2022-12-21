const {
    client,
    getAllUsers, 
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    updatePost,
    getPostsByUser,
    getUserById, 
    createTags
} = require('./index');


const dropTables = async () => {
    try {
        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
        `);
    } catch (error) {
        console.error('ERROR in dropTables', error);
        throw error;
    }
};

const createTables = async () => {
    try {
        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY, 
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL, 
            name VARCHAR(255) NOT NULL, 
            location VARCHAR(255) NOT NULL, 
            active BOOLEAN DEFAULT true
        );

        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL, 
            active BOOLEAN DEFAULT true
        );

        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );

        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id) UNIQUE,
            "tagId" INTEGER REFERENCES tags(id) UNIQUE 
        );
        `);
    } catch (error) {
        console.error('ERROR in createTables', error);
        throw error;
    }
};

// here we use the createUser function in index.js to create a batch of new users to seed our DB 
const createInitialUsers = async () => {
    try {
        console.log('Beginning to create initial users...');

        const albert = await createUser({
            username: 'albert', 
            password: 'bertie99',
            name: 'Albert Gray',
            location: 'New York'
        });
        // console.log('this is albert =', albert);

        const sandra = await createUser({
            username: 'sandra', 
            password: '2sandy4me',
            name: 'Sandra Jones',
            location: 'Chicago'
        });
        // console.log('this is sandra =', sandra);

        const glamgal = await createUser({
            username: 'glamgal', 
            password: 'glam4life',
            name: 'Sarah Smith',
            location: 'Toronto'
        });
        // console.log('this is glamgal =', glamgal);

        console.log('Finished creating initial users')
    } catch (error) {
        console.error('ERROR in createInitialUsers', error);
        throw error;
    }
};

// here we create initial posts for our initial users 
const createInitialPosts = async () => {
    try {
        console.log('Beginning to create initial posts...');

        // destructure the returned users from array from getAllUsers, assign each object by their name cause we know they are returned in that order
        [albert, sandra, glamgal] = await getAllUsers();
        
        await createPost({
            authorId: albert.id, 
            title: 'Dogs are the best!', 
            content: 'This post is all about dogs, I love dogs so much!'
        });

        await createPost({
            authorId: sandra.id, 
            title: 'Cats are the best!', 
            content: 'This post is all about cats, I love cats so much!'
        });

        await createPost({
            authorId: glamgal.id, 
            title: 'Birds are the best!', 
            content: 'This post is all about birds, I love birds so much!'
        });

        console.log('Finished creating initial posts!');
    } catch (error) {
        console.error('ERROR in createInitialPosts', error)
        throw error;
    }
};

const createInitialTags = async () => {
    console.log('Beginning to create tags...');
    
    await createTags(["#first", "#best", "#glory-days"]);
    
    // try { 

    // } catch (error) {
    //     console.error('ERROR in createInitialTags', error)
    //     throw error;
    // }
    console.log('Finished creating tags');
};

// here we reuibld our DB
const rebuildDB = async () => {
try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    await createInitialTags();
    // await updateUser(1, {name: 'Kevin', location: 'River West'});
} catch (error) {
    console.error('ERROR in rebuildDB', error);
    throw error;
}
}


const testDB = async () => {
    try {
        console.log('Beginning to test the database...')
        
        
        // console.log('calling allUsers...')
        // const allUsers = await getAllUsers();
        // console.log('this is allUsers = ', allUsers);

        // console.log('calling getUsersById...')
        // const newUser = await getUserById(1);
        // console.log('this is getUserById with their posts attached = ', newUser);

        // // allUsers returns array of all users, this test takes the id off the first user in the array (albert in this case), passes it as a parameter and also an object with the values we want to update to the update user funciton in index.js. same idea with update Posts

        // console.log('calling updateUser on allUsers[0]');
        // const updateUserResult = await updateUser(allUsers[0].id, {
        //     name: 'Kevin', 
        //     location: 'River West'
        // });
        // console.log('result of update user = ', updateUserResult);

        // console.log('calling getAllPosts...');
        // const allPosts = await getAllPosts();
        // console.log('this is result for allPosts =', allPosts);

        // console.log('calling getPostsByUser on allUsers[0]...');
        // const userPosts = await getPostsByUser(allUsers[0].id);
        // console.log('this is result for postsByUser =', userPosts);

        // console.log('calling updatePost on allPosts[0]...');
        // const updatedPostResult = await updatePost(allPosts[0].id, {
        //     title: 'Dogs actually stink!',
        //     content: 'I changed my mind, dogs stink! '
        // });
        // console.log('this is result for updatePosts', updatedPostResult);

    //     console.log('calling createTags...');
    //     const newTags = await createTags();
    //     console.log('this is result for createTags =', newTags);

        console.log('Finished testing the database!')
    } catch (error) {
        console.error('ERROR in testDB', error);
    }
};

const init = async () => {
    try {
        await rebuildDB();
        await testDB();

    } catch (error) {
        console.error('ERROR in init', error)
    } finally {
        client.end();
    }
};

init(); 