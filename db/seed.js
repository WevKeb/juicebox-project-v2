const {
    client,
    getAllUsers, 
    createUser
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
            password VARCHAR(255) NOT NULL 
        );
        `);
    } catch (error) {
        console.error('ERROR in createTables');
    }
};

const createInitialUsers = async () => {
    try {
        console.log('Beginning to create initial users...');

        const albert = await createUser({username: 'albert', password: 'bertie99'});
        console.log('this is albert =', albert);

        const sandra = await createUser({username: 'sandra', password: '2sandy4me'});
        console.log('this is sandra =', sandra);

        const glamgal = await createUser({username: 'glamgal', password: 'glam4life'});
        console.log('this is glamgal =', glamgal);

        console.log('Finished creating initial users')
    } catch (error) {
        console.error('ERROR in createInitialUsers');
        throw error;
    }
};


const rebuildDB = async () => {
try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
} catch (error) {
    console.error('ERROR in rebuildDB')
}
}

const testDB = async () => {
    try {
        console.log('Beginning to test the database...')
        
        

        const allUsers = await getAllUsers();
        console.log('this is allUsers = ', allUsers);

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