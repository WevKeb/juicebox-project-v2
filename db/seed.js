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
    createTags,
    addTagsToPost, 
    getPostsByTagName
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
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id), 
            UNIQUE("postId", "tagId")
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
            content: 'This post is all about dogs, I love dogs so much!',
            tags: ["#happy", "#youcandoanything"]
        });

        await createPost({
            authorId: sandra.id, 
            title: 'Cats are the best!', 
            content: 'This post is all about cats, I love cats so much!',
            tags: ["#happy", "#worst-day-ever"]
        });

        await createPost({
            authorId: glamgal.id, 
            title: 'Birds are the best!', 
            content: 'This post is all about birds, I love birds so much!',
            tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
        });

        console.log('Finished creating initial posts!');
    } catch (error) {
        console.error('ERROR in createInitialPosts', error)
        throw error;
    }
};

// const createInitialTags = async () => {
//     try {
//     console.log('Beginning to create tags...');
    
//     const [happy, sad, inspo, catman] = await createTags([
//         '#happy', 
//         '#worst-day-ever', 
//         '#youcandoanything',
//         '#catmandoeverything'
//       ]);
//       console.log([happy, inspo]);
// // ^ this correctly returns an array of the new tags created, we destructure them and assign them to variables as an object with id, name on it

//       const [postOne, postTwo, postThree] = await getAllPosts();
//     //   console.log(postOne.id);
// // ^ do same thing with posts, assign returned posts array to variables as individual objects with post assigned to them

//     const postWithTags = await addTagsToPost(postOne.id, [happy, inspo]);
// // console.log(postWithTags);
//     const postWithTags2 = await addTagsToPost(postTwo.id, [sad, inspo]);
// // console.log(postWithTags2);
//     const postWithTags3 = await addTagsToPost(postThree.id, [happy, catman, inspo]);
// // console.log(postWithTags3);
    
//     // console.log("Finished creating tags!");
//     } catch (error) {
//         console.error('ERROR in createInitialTags', error)
//         throw error;
//     };
// };

// here we reuibld our DB


const rebuildDB = async () => {
try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    // await createInitialTags();
    // await updateUser(1, {name: 'Kevin', location: 'River West'});
} catch (error) {
    console.error('ERROR in rebuildDB', error);
    throw error;
}
};


const testDB = async () => {
    try {
        console.log('Beginning to test the database...')
        
        
        console.log('calling allUsers...')
        const allUsers = await getAllUsers();
        console.log('this is allUsers = ', allUsers);

        console.log('calling getUsersById...')
        const newUser = await getUserById(1);
        console.log('this is getUserById with their posts attached = ', newUser);

        // // allUsers returns array of all users, this test takes the id off the first user in the array (albert in this case), passes it as a parameter and also an object with the values we want to update to the update user funciton in index.js. same idea with update Posts

        console.log('calling updateUser on allUsers[0]');
        const updateUserResult = await updateUser(allUsers[0].id, {
            name: 'Kevin', 
            location: 'River West'
        });
        console.log('result of update user = ', updateUserResult);

        console.log('calling getAllPosts...');
        const allPosts = await getAllPosts();
        console.log('this is result for allPosts =', allPosts);

        console.log('calling getPostsByUser on allUsers[0]...');
        const userPosts = await getPostsByUser(allUsers[0].id);
        console.log('this is result for postsByUser =', userPosts);

        // console.log('calling updatePost on allPosts[0]...');
        // const updatedPostResult = await updatePost(allPosts[0].id, {
        //     title: 'Dogs actually stink!',
        //     content: 'I changed my mind, dogs stink! '
        // });
        // console.log('this is result for updatePosts', updatedPostResult);

        // console.log('calling createTags...');
        // const newTags = await createTags();
        // console.log('this is result for createTags =', newTags);

        // console.log('calling selectInsertedTags...');
        // const selectedTags = await selectInsertedTags(tagList);
        // console.log('this is result for selectInsertedTags =', selectedTags);

        console.log("Calling updatePost on posts[1], only updating tags");
        const updatePostTagsResult = await updatePost(allPosts[1].id, {
        tags: ["#youcandoanything", "#redfish", "#bluefish"]});
        console.log("Result:", updatePostTagsResult);

        console.log("Calling getPostsByTagName with #happy");
        const postsWithHappy = await getPostsByTagName("#happy");
        console.log("Result:", postsWithHappy);

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