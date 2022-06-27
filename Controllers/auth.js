const mysql = require('mysql')
const bycrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { promisify } = require('util')

// Mysql Connection
const DB = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})


exports.register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body

    DB.query('SELECT email FROM users WHERE email = ?', [email], async (errors, results) => {
        if (errors) {
            console.log(errors);
        } else if (results.length > 0) {
            return res.render('register', {
                message: 'That email is already taken'
            })
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Password Do not Match'
            })
        }

        let hashedPassword = await bycrypt.hash(password, 2)

        console.log(hashedPassword);

        DB.query('INSERT INTO users SET ? ', { name: name, email: email, password: hashedPassword }, (errors, results) => {
            if(errors) {
                console.log(errors);
            } else {
                return res.render('register', {
                    message: 'User Registration SuccessFull'
                })
            }
        })
    })

}

exports.login = (req, res) => {
    try {
        const { email, password } = req.body

        console.log(req.body);
        
        if (!email || !password) {
            return res.status(400).render('login', {
                message: 'Please Proved required Credentials'
            })
        }

        DB.query('SELECT * FROM users WHERE email = ?', [email], async (errors, results) => {
            console.log('RESULTS: ',results);
            if (!results || !(await bycrypt.compare(password, results[0].password))) {
                res.status(401).render('login', {
                    message: 'Please provide correct email or password'
                })
            } else {
                const id = results[0].id
                
                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })

                console.log(token);

                const cookieOption = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
                    ),
                    httpOnly: true
                }

                res.cookie('jwt', token, cookieOption)
                res.status(200).redirect('/profile')
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.isLoggedIn = async (req, res, next) => {
    
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
            

            DB.query('SELECT * FROM users WHERE id = ?', [decoded.id], (errors, results) => {
                if (!results) {
                    return next()
                }

                req.user = results[0]
                return next()
            })
        } catch (error) {
            console.log(error);
            return next()
        }
    } else {
        next()
    }
    
}

exports.logout = (req, res) => {
    // console.log('LOGOUT');
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    })

    res.status(200).redirect('/')
}

