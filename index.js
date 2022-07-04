const Joi = require('joi');
const express = require('express');
const app = express();

const { expressjwt: expressJwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jwtScope = require('express-jwt-scope');
const jwt_decode = require('jwt-decode');

// middleware for permission check
//  Checks req.auth['permission']
const checkPermissions = (permissions)=> jwtScope(permissions, { scopeKey : 'permissions' });
const checkPermissionsRequired = (permissions)=> jwtScope(permissions, { scopeKey : 'permissions', requireAll: true });

const authConfig = require('./auth_config.json');

app.use(express.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://m3rzh1n.github.io");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin,Content-Type, Authorization, x-id, Content-Length, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

const courses = [
    {id: 101, name: 'Windows Dummies', userid:["auth0|61bb8ebaf995f80069de2acf", "auth0|61bb8ebaf995f80069de2ac1", "auth0|61bb8ebaf995f80069de2ac2" ]},
    {id: 102, name: 'MacOS Dummies', userid:["auth0|61bb8ebaf995f80069de2ac1", "auth0|61bb8ebaf995f80069de2ac2"]},
    {id: 103, name: 'Linux for Dummies', userid:["auth0|61bb8ebaf995f80069de2acf"]},
]

const test = "auth0|61bb8ebaf995f80069de2acf";

// middleware for authorization check
const authorizeAccessToken = expressJwt({
    secret: jwksRsa.expressJwtSecret({
        cache:true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
    }),
    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ["RS256"]
});



app.get('/', (req, res) => {
    res.send('Hello World!!!');
});
//-------------------------------------------------------------------------------------//
app.get('/api/courses', (req, res) => {
    const nameArray = courses.map(function (el) { return el.name; });
    res.send(nameArray);
});

app.get('/api/mycourses', authorizeAccessToken, (req, res) => {
    const userCourses = courses.filter(item => item.userid.indexOf('auth0|61bb8ebaf995f80069de2acf') !== -1);
    const nameArray = userCourses.map(function (el) { return el.name; });
    res.send(nameArray);
});

app.get('/api/courses/details', authorizeAccessToken, checkPermissions('read:courses'), (req, res) => {
    const nameArray = courses.map(function (el) { return [el.id, el.name]; });
    res.send(nameArray);
});

app.get('/api/courses/details/users', authorizeAccessToken, checkPermissionsRequired('read:courses read:admin'), (req, res) => {
    const nameArray = courses.map(function (el) { return [el.name, el.userid]; });
    res.send(nameArray);
});

//-------------------------------------------------------------------------------------//
app.get('/api/role',authorizeAccessToken, checkPermissions('read:message'), (req, res) => {
    res.json({
        msg:"You called the role endpoint!"
    });
});

//add new course
app.post('/api/courses', (req, res) => {

    const { error } = validateCourse(req.body); //result.error
    if(error) return res.status(400).send(error.details[0].message);

    const course = {
        id: courses.length +1,
        name: req.body.name
    };
    courses.push(course);
    res.send(course);
});

//update course
app.put('/api/courses/:id', (req, res) => {
    
    // check if course exists
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).send('The course with the given id was not found!');  
    
    const { error } = validateCourse(req.body); //result.error
    if(error) return res.status(400).send(error.details[0].message);

    //Update Course
    course.name = req.body.name
    res.send(course);
});

//delete
app.delete('/api/courses/:id', (req, res) => {
    
    // check if course exists
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).send('The course with the given id was not found!');  
    
    const index = courses.indexOf(course);
    courses.splice(index, 1);

    res.send(course);
});


function validateCourse(course){
        // check the schema
        const schema = Joi.object({
            name: Joi.string().min(3).required()
        });
        return schema.validate(course);
};

app.get('/api/courses/:id', authorizeAccessToken,(req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).send('The course with the given id was not found!');

    //decode header token
    const headerToken = req.headers.authorization.split(' ')[1];
    const decodedHeader = jwt_decode(headerToken);
    console.log(decodedHeader.sub);
    res.send(course);
});

// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port} ...`));