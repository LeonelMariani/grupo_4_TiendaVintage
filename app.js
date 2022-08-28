const express = require("express");
const path = require("path");
const methodOverride = require('method-override');
const session = require('express-session');
const cookieParser = require('cookie-parser');
<<<<<<< HEAD
const productsInCartMiddleware = require('./middlewares/productsInCartMiddleware');
=======
const productCountMiddleware = require ('./middlewares/productCountMiddleware');
>>>>>>> 87cebbb108bec7b90de8545f88462129f5e32d61


const app = express();

const publicPath = path.join(__dirname, "./public");

app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));
<<<<<<< HEAD
app.use(session({
    secret: 'Hush hush',
    resave: false,
    saveUninitialized: false
}));
app.use(cookieParser());
app.use(productsInCartMiddleware);
=======
app.use(session ({ secret: 'Hush hush',
                    resave: false,
                    saveUninitialized: false }));
app.use (cookieParser());
app.use (productCountMiddleware);
>>>>>>> 87cebbb108bec7b90de8545f88462129f5e32d61

const indexRouter = require('./src/routers/index.js');
const productsRouter = require('./src/routers/products.js');
const usersRouter = require('./src/routers/users.js');
const adminRouter = require('./src/routers/admin.js');


app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, './src/views'));


app.listen(process.env.PORT || 3040, () => {
    console.log("Servidor corriendo en el puerto 3040");
})







