const {Client} = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev2');


// ***************** Below is all Users functions *********************


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
    content, 
    tags = []
}
    // createPost by destructuring the object that was passed as parameter with the valuee we need to passinto the dependency array to be used in our SQL query 
) => {
    try {
        const { rows: [ post ] } = await client.query(`
          INSERT INTO posts("authorId", title, content) 
          VALUES($1, $2, $3)
          RETURNING *;
        `, [authorId, title, content]);
    
        const tagList = await createTags(tags);
    
        return await addTagsToPost(post.id, tagList);
    } catch (error) {
        console.error('ERROR in createPost', error)
        throw error;
    }
};

const getAllPosts = async () => {
    try {
        const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
        `);

        const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
        ));

        return posts;
    } catch (error) {
        console.error('ERROR in getAllPosts', error)
        throw error;
    }
};

// gonna get object with title and content on it
const updatePost = async (postId, fields = {}) => {
     // read off the tags & remove that field 
  const { tags } = fields; // might be undefined
  delete fields.tags;

  // build the set string
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  try {
    // update any fields that need to be updated
    if (setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postId }
        RETURNING *;
      `, Object.values(fields));
    }

    // return early if there's no tags to update
    if (tags === undefined) {
      return await getPostById(postId);
    }

    // make any new tags that need to be made
    const tagList = await createTags(tags);
    const tagListIdString = tagList.map(
      tag => `${ tag.id }`
    ).join(', ');

    // delete any post_tags from the database which aren't in that tagList
    await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [postId]);

    // and create post_tags as necessary
    await addTagsToPost(postId, tagList);

    return await getPostById(postId);
    } catch (error) {
        console.error('ERROR in getUpdatePsts', error)
        throw error
    }
};

const getPostsByUser = async (userId) => {
    try {
        const { rows: postIds } = await client.query(`
          SELECT id 
          FROM posts 
          WHERE "authorId"=${ userId };
        `);
        console.log(postIds);
    // take array of postIds objects created in teh query above ^.
    //then we want to map through that array, take each item/post object and then run the id value on that into the getPostbyID function
    // this returns an array of promises, which we will then execute using await pormise.all. we want it this way to allow ourselves the ability to grab multiple users at once dynamically
        const posts = await Promise.all(postIds.map(
          post => getPostById( post.id )
        ));
    
        return posts;
      } catch (error) {
        throw error;
      }
    };


// ***************** Below is all Tags functions *********************

//the immediate function below is a working function that creates initial tags passed from our seed.js and then selectes and returns those tags just inserted
const createTags = async (tagList) => {
    // console.log('this is our taglist ==> ',tagList);
    if (tagList.length === 0) {
        return;
    }

    const insertValues = tagList.map(
        (tag, index) => `($${index + 1})`
    );

    // console.log('this is insertValues------->', insertValues);
    try {
        const {rows: newTags} = await client.query(`
        INSERT INTO tags(name)
        VALUES ${insertValues}
        ON CONFLICT (name) DO NOTHING
        `, tagList);

        // console.log('this is newTags ------->', newTags);
        console.log('this is the return function', await selectCreatedTags(tagList));
        return await selectCreatedTags(tagList);
        // return the just inserted tags using a selectInsertedTags function below
    } catch (error) {
        console.error('ERROR inside createTags', error)
        throw error
    }
};


// this selects the passed array of tags that were just inserted in teh function above. couldn't get them to work in a single function 
async function selectCreatedTags(tagList) {
    if (tagList.length === 0) {
        return;
    }
    
    const selectValues = tagList.map(
        (tag, index) => `$${index + 1}`).join(', ');

    // console.log('this is selectValues ---->', selectValues);
    try {
        const {rows: selectedTags} = await client.query(`
        SELECT * FROM tags
        WHERE name 
        IN (${selectValues});
        `, tagList) 

        // console.log('selectedTags ----->', selectedTags);
        return selectedTags;
        // ^ this returns array of tag objects with tag.id and tag.name 
    } catch (error) {
        console.error('ERROR in selectTags', error)
        throw error
    };
};

// ***************** Below is all Tags functions *********************

async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
  
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
  };

  // pass the
async function addTagsToPost(postId, tagList) {
    try {
      const createPostTagPromises = tagList.map(
        tag => createPostTag(postId, tag.id)
      );
        // console.log('this is array of promises ---->',createPostTagPromises);
      
        await Promise.all(createPostTagPromises);
  
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  };

async function createPostTag(postId, tagId) {
    try {
      await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING
        
      `, [postId, tagId]);
    } catch (error) {
      throw error;
    }
  };

  async function getPostsByTagName(tagName) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      return await Promise.all(postIds.map(
        post => getPostById(post.id)
      ));
    } catch (error) {
      throw error;
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
    getUserById,
    createTags,
    selectCreatedTags,
    addTagsToPost,
    getPostsByTagName
};