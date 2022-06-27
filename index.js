const express = require('express')
const mysql = require('mysql')
const dotenv = require('dotenv')
const path = require('path')
const cookie = require('cookie-parser')
const cookieParser = require('cookie-parser')


// This is to make sure that the server starts
const app = express()

// Public directory accesspoint
// CSS and JS or IMG files

const publicDirectory = path.join(__dirname, './public')

// Make sire that express is using the public directory
app.use(express.static(publicDirectory))

dotenv.config({
    path:'./.env'
})

// Setting up the View Engine
// Put everthing in a folder name views
app.set('view engine', 'hbs')

// Parsing URL encoded body that is been sent by HTML forms
app.use(express.urlencoded({ extended: false }))

// Values that we are getting from the form must come in json format
app.use(express.json())
app.use(cookieParser())

// Defining routes
app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth'))

// Mysql Connection
const DB = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

DB.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log('MySQL is Connected');
    }
})

app.listen(5000, () => {
    console.log('Server started at port 5000');
})