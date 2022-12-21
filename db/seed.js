const {
    client,
    getAllUsers, 
    createUser,
    updateUser
} = require('./index');


const dropTables = async () => {
    try {
        await client.query(`
        DROP TABLE IF EXISTS users;
        `)
    } catch (error) {
        console.error('ERROR in dropTables');
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
        `);
    } catch (error) {
        console.error('ERROR in createTables');
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
        console.error('ERROR in createInitialUsers');
        throw error;
    }
};

// here we reuibld our DB
const rebuildDB = async () => {
try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    // await updateUser(1, {name: 'Kevin', location: 'River West'});
} catch (error) {
    console.error('ERROR in rebuildDB');
    throw error;
}
}


const testDB = async () => {
    try {
        console.log('Beginning to test the database...')
        
        
        console.log('calling allUsers...')
        const allUsers = await getAllUsers();
        console.log('this is allUsers = ', allUsers);

        // allUsers returns array of all users, this test takes the id off the first user in teh array (albert in this case), passes it as a parameter and also an object with the values we want to update to the update user funciton in index.js
        console.log('calling updateUser on allUsers[0]');
        const updateUserResult = await updateUser(allUsers[0].id, {
            name: 'Kevin', 
            location: 'River West'
        });
        
        console.log('result of update user = ', updateUserResult);

        console.log('Finished testing the database!')
    } catch (error) {
        console.error(('ERROR in testDB'));
    }
};

const init = async () => {
    try {
        await rebuildDB();
        await testDB();

    } catch (error) {
        console.error('ERROR in init')
    } finally {
        client.end();
    }
};

init(); 