const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

function baseURL(req) {
  return `${req.protocol}://${req.get("host")}`;
}

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });

  return res.status(201).json({ message: "User successfully registered" });
});

public_users.get("/", (req, res) => {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

public_users.get("/isbn/:isbn", (req, res) => {
  const { isbn } = req.params;

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book);
});

public_users.get("/author/:author", (req, res) => {
  const { author } = req.params;

  const matches = Object.keys(books)
    .map((k) => ({ isbn: k, ...books[k] }))
    .filter(
      (b) => b.author && b.author.toLowerCase() === author.toLowerCase()
    );

  if (!matches.length) {
    return res.status(404).json({ message: "No books by this author" });
  }

  return res.status(200).json(matches);
});

public_users.get("/title/:title", (req, res) => {
  const { title } = req.params;

  const matches = Object.keys(books)
    .map((k) => ({ isbn: k, ...books[k] }))
    .filter(
      (b) => b.title && b.title.toLowerCase() === title.toLowerCase()
    );

  if (!matches.length) {
    return res.status(404).json({ message: "No books with this title" });
  }

  return res.status(200).json(matches);
});

public_users.get("/review/:isbn", (req, res) => {
  const { isbn } = req.params;

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book.reviews || {});
});

public_users.get("/async/books", async (req, res) => {
  try {
    const { data } = await axios.get(`${baseURL(req)}/`);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch books via Axios",
      error: err.message
    });
  }
});

public_users.get("/async/isbn/:isbn", (req, res) => {
  axios
    .get(`${baseURL(req)}/isbn/${encodeURIComponent(req.params.isbn)}`)
    .then((response) => {
      return res.status(200).json(response.data);
    })
    .catch((err) => {
      const status = err.response?.status || 500;
      return res.status(status).json({
        message: "Failed to fetch by ISBN via Axios",
        error: err.message
      });
    });
});

public_users.get("/async/author/:author", (req, res) => {
  axios
    .get(
      `${baseURL(req)}/author/${encodeURIComponent(req.params.author)}`
    )
    .then((response) => {
      return res.status(200).json(response.data);
    })
    .catch((err) => {
      const status = err.response?.status || 500;
      return res.status(status).json({
        message: "Failed to fetch by author via Axios",
        error: err.message
      });
    });
});

public_users.get("/async/title/:title", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${baseURL(req)}/title/${encodeURIComponent(req.params.title)}`
    );
    return res.status(200).json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    return res.status(status).json({
      message: "Failed to fetch by title via Axios",
      error: err.message
    });
  }
});

module.exports.general = public_users;
