const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const { v4: uuidv4 } = require('uuid');

app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const connection = mysql.createConnection({
 host: 'localhost',
 user: 'root',
 password: 'Mysql@#1234',
 database: 'delta_app',
 });

 let getRandomUser = () =>{
  return [
    faker.string.uuid(),
    faker.internet.username(), // before version 9.1.0, use userName()
    faker.internet.email(),
    faker.internet.password(),
  ];
}

//Home rout
app.get("/", (req, res)=>{
    let q = "SELECT count(*) FROM user";
    try{
    connection.query(q, (err, result) => {
        if (err) throw err;
        let count =result[0]["count(*)"];
        res.render("Home.ejs", {count});
     });
 } catch (err) {
    console.log(err);
    res.send("Some error Occurred in DB")
 }

});

//Show Users Rout

app.get("/user", (req, res)=>{
 let q = "SELECT * FROM user";
  try{
    connection.query(q, (err, users) => {
        if (err) throw err;
        res.render("Showusers.ejs", {users});
     });
 } catch (err) {
    console.log(err);
    res.send("Some error Occurred in DB")
 }
})
 
//edit form
app.get("/user/:id/edit", (req, res) => {
  const { id } = req.params;
  const q = `SELECT * FROM user WHERE id = '${id}'`;
  connection.query(q, [id], (err, results) => {
    if (err || results.length === 0) return res.send("User not found");
    res.render("edit.ejs", { user: results[0] });
  });
});

//Update data
app.patch("/user/:id", (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  // Step 1: Get the existing password from the DB
  const getPasswordQuery = "SELECT password FROM user WHERE id = ?";
  connection.query(getPasswordQuery, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send("User not found");
    }

    const storedPassword = results[0].password;

    // Step 2: Compare passwords (Note: In real apps, use hashed passwords)
    if (password !== storedPassword) {
      return res.status(401).send("Incorrect password. Update denied.");
    }

    // Step 3: Proceed to update
    const updateQuery = "UPDATE user SET username = ?, email = ? WHERE id = ?";
    connection.query(updateQuery, [username, email, id], (updateErr, updateResult) => {
      if (updateErr) return res.status(500).send("Update failed");
      res.redirect("/user");
    });
  });
});

//Delete route
app.delete("/user/:id", (req, res) => {
  const { id } = req.params;
  const q = "DELETE FROM user WHERE id = ?";
  connection.query(q, [id], (err) => {
    if (err) return res.send("Delete failed");
    res.redirect("/user");
  });
});

//add new user

// Show Create User Form
app.get("/user/new", (req, res) => {
  res.render("newuser"); // Renders newuser.ejs
});

// Handle Create User Form POST
app.post("/user", (req, res) => {
  const { username, email, password } = req.body;
  const id = uuidv4(); // generate a UUID manually

  const q = "INSERT INTO user (id, username, email, password) VALUES (?, ?, ?, ?)";
  connection.query(q, [id, username, email, password], (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.send("Error creating user: " + err.message);
    }
    res.redirect("/user");
  });
});



app.listen("8080", ()=>{
    console.log("Server is Listening at port 8080");
});

//let q = "INSERT INTO user (id, username, email, password) VALUES ?";
// let data = [];
// for( let i=1; i<=100; i++){
//     data.push(getRandomUser()); 
// };

//  try{
//     connection.query(q ,[data], (err, result) => {
//         if (err) throw err;
//         console.log(result); });
//  } catch (err) {
//     console.log(err);
//  }

//  connection.end();