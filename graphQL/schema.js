const { buildSchema } = require("graphql");

module.exports = buildSchema(`

    type Post {

        _id:ID!
        title:String!
        content:String!
        imageUrl:String!
        creator:User!
        createdAt:String!
        updatedAt:String!
    }

    type User {
        _id:ID!
        name:String!
        email:String!
        password:String
        status:String!
        post:[Post!]!
    }

    input userInputData {
        email:String!
        name:String!
        password:String!
    }

    type loginData {
        token:String!
        userId:String!

    }

    type RootMutation {
        createUser(userInput:userInputData):User!
    }

    type RootQuery {
        login(email:String!,password:String!):loginData!
    }
    schema {
        mutation:RootMutation
        query:RootQuery
    }


`);

//     For Getting Data

//   type DataPayload {
//     text:String!
//     number:Int!
// }
// type RootQuery {
//     ferhat:DataPayload!
// }
// schema {
//     query:RootQuery
// }
