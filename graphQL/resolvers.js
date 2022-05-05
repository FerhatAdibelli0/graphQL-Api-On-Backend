const User = require("../Model/user");
const bcrypt = require("bcrypt");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User is already existing!");
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });
    const createdUser = await user.save();

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },
};

// For Getting Data

//   ferhat() {
//     return {
//       text: "Ferhat is best software engineer",
//       number: 4452639,
//     };
//   },
