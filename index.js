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
    {id: 958476, name: 'The Lost City', userid:["auth0|62c3237267fdea356d288e2b", "auth0|61bb8ebaf995f80069de2ac1", "auth0|61bb8ebaf995f80069de2ac2" ]},
    {id: 958477, name: 'Dune', userid:["auth0|61bb8ebaf995f80069de2ac1", "auth0|61bb8ebaf995f80069de2ac2"]},
    {id: 958478, name: '22 Seconds', userid:[]},
    {id: 958479, name: 'Dream Town', userid:["auth0|62c3237267fdea356d288e2b"]},
    {id: 958480, name: 'Nightwork', userid:["auth0|62c3237267fdea356d288e2b"]},
    {id: 958481, name: 'The Fifth Season', userid:["auth0|61bb8ebaf995f80069de2acf"]},
    {id: 958482, name: 'Observer', userid:["auth0|62c3237267fdea356d288e2b"]},
]

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
app.get('/api/books', (req, res) => {
    const nameArray = courses.map(function (el) { return el.name; });
    res.send(nameArray);
});

app.get('/api/mybooks', authorizeAccessToken, (req, res) => {
    //decode header token
    const headerToken = req.headers.authorization.split(' ')[1];
    const decodedHeader = jwt_decode(headerToken);
    const user = decodedHeader.sub;

    const userCourses = courses.filter(item => item.userid.indexOf(user) !== -1);
    const nameArray = userCourses.map(function (el) { return el.name; });
    res.send(nameArray);
});

app.get('/api/books/details', authorizeAccessToken, checkPermissions('read:books'), (req, res) => {
    const nameArray = courses.map(function (el) { return [el.id, el.name]; });
    res.send(nameArray);
});

app.get('/api/books/details/users', authorizeAccessToken, checkPermissionsRequired('read:books read:books-admin'), (req, res) => {
    const nameArray = courses.map(function (el) { return [el.name, el.userid]; });
    res.send(nameArray);
});

//-------------------------------------------------------------------------------------//

// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port} ...`));