const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");

const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return !users.find((u) => u.username === username);
};

const authenticatedUser = (username, password) => {
  return !!users.find((u) => u.username === username && u.password === password);
};

regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login credentials" });
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
  req.session.authorization = { accessToken };

  return res.status(200).json({ message: "User successfully logged in" });
});

regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;

  const review =
    typeof req.query.review === "string" && req.query.review.trim() !== ""
      ? req.query.review
      : req.body?.review;

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!review) {
    return res.status(400).json({
      message: "Review text is required (use ?review=... or { review })"
    });
  }

  const username = req.user?.username;

  if (!username) {
    return res.status(403).json({ message: "Not authenticated" });
  }

  book.reviews = book.reviews || {};
  book.reviews[username] = review;

  return res
    .status(200)
    .json({ message: "Review added/updated", reviews: book.reviews });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  const username = req.user?.username;

  if (!username) {
    return res.status(403).json({ message: "Not authenticated" });
  }

  if (!book.reviews || !book.reviews[username]) {
    return res
      .status(404)
      .json({ message: "No review by this user for this book" });
  }

  delete book.reviews[username];

  return res
    .status(200)
    .json({ message: "Review deleted", reviews: book.reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
