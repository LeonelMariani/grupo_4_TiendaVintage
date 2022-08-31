const express= require('express');
let router= express.Router();


let usersController= require('../controllers/usersController');
let validationImage= require('../../middlewares/validationImage');
let validationRegister= require('../../middlewares/validationRegister');
let validationLogin= require('../../middlewares/validationLogin.js');


router.get('/login', usersController.login);

router.post('/login', validationLogin, usersController.loginProcess);

router.get('/registro', usersController.register);

router.post('/new/register',validationImage.single('image'),validationRegister,usersController.store);

router.get('/profile/:id', usersController.profile);

module.exports=router;