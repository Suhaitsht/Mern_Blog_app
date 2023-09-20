const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "please Enter a username"],
    min: 4,
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please Enter a password"],
  },
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
