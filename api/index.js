const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);
const secret = "asdfe45we45w345wegw345werjktjwertkj";

const app = express();
const UserModel = app.use(
  cors({ credentials: true, origin: "http://localhost:3000" })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
const PORT = 8000;
const DATABASE =
  "mongodb+srv://suhaitsuhait58:Suhait123@cluster0.up37bpq.mongodb.net/?retryWrites=true&w=majority";

// User Registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
    res.status(200);
  } catch (err) {
    res.status(400).json({
      status: "failed",
      messages: err,
    });
    console.log(`There is an error in Data create Registaration${err}`);
  }
});
//

// User Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const Result = bcrypt.compareSync(password, userDoc.password);
  if (Result) {
    // res.json(Result);
    JWT.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).json({ id: userDoc._id, username });
    });
  } else {
    res.json(Result);
  }
});

// Profile check
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  JWT.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});
//

//  create post router
app.post("/createPost", upload.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  JWT.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;

    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });
});

// getdatafrom database

app.get("/post", async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(10);
  res.json(posts);
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

app.put("/post", upload.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }
  const { token } = req.cookies;
  JWT.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content, id } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      res.status(400).json("You are Not Author");
    }
    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });
    res.json(postDoc);
  });
});

// Logout
app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

// Database connection
mongoose.connect(DATABASE);

app.listen(PORT, () => {
  console.log(`server running port is ${PORT}`);
});
