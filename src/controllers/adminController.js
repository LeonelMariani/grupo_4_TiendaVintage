// const Product = require('../models/Product');
// const Category = require ('../models/Category');
const db = require('../database/models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const toThousand = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// const resultValidation = validationResult(req);
// if (resultValidation.errors.length > 0){
// return res.render ('./admin/createProduct', {errors: resultValidation.mapped()})
// }

const controller = {
    createProduct: (req, res) => {
        // ******** versión sin BD ********
        // let categories = Category.findAll();
        // return res.render ('./admin/createProduct', {categories});
        // ********************************
        let getColors = db.Colors.findAll({
            order: [['name']]
        });
        let getProductCategories = db.Product_Categories.findAll();

        Promise.all([getProductCategories, getColors])
            .then(([categories, colors]) => {
                return res.render('./admin/createProduct', { categories, colors });
            })
            .catch((error) => {
                console.log(error);
                return res.render('error');
            })

    },

    storeProduct: (req, res) => {

        // ******** versión sin BD ********
        // let products = Product.findAll();

        // /***** Obtengo el máximo ID utilizado *****/
        // let maxId = Math.max ( ...products.map ( product => {
        //         return product.id;
        // }));

        // let categoryName = Category.findById(req.body.category).name;

        // /***** Completo los campos del nuevo producto *****/
        // let newProduct = req.body;

        // newProduct.price = parseInt (newProduct.price);
        // newProduct.discount = newProduct.discount != ''? parseInt (newProduct.discount) : 0;
        // newProduct.id = maxId + 1;
        // newProduct.image = '/images/products/' + categoryName + '/' + req.file.filename;
        // newProduct.special = req.body.special? 1:0;

        // Product.addProduct (newProduct);

        // return res.redirect ('/admin');
        // ********************************

        //********** COMIENZO AGREGADO POR MB PARA PROBAR VALIDACIÓN DE ARCHIVO EN MULTER  */

        const resultValidations = validationResult(req);
        let old = req.body;


        // Si el usuario ingresó solamente 1 color lo convierto en un array para poder trabajarlo en la vista //
        if (!Array.isArray(req.body.colors)) {
            old.colors = [req.body.colors];
        }
        if (resultValidations.errors.length > 0 || req.imgError) {
            const errors = resultValidations.mapped()
            if (req.imgError)
                res.locals.imgError = req.imgError;

            let getColors = db.Colors.findAll({
                order: [['name']]
            });
            let getProductCategories = db.Product_Categories.findAll();

            Promise.all([getProductCategories, getColors])
                .then(([categories, colors]) => {
                    return res.render('./admin/createProduct', { categories, colors, old, errors });
                })
                .catch((error) => {
                    console.log(error);
                    return res.render('error');
                })
        } else {
            //********** FIN AGREGADO POR MB PARA PROBAR VALIDACIÓN DE ARCHIVO EN MULTER  */

            db.Product_Categories.findByPk(req.body.category_id)
                .then(category => {
                    // remove accents and convert to lowercase
                    let categoryName = (category.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")).toLowerCase();

                    db.Products.create({
                        name: req.body.name,
                        description: req.body.description,
                        price: req.body.price,
                        discount: req.body.discount,
                        special: req.body.special ? 1 : 0,
                        img: '/images/products/' + categoryName + '/' + req.file.filename,
                        category_id: req.body.category_id,
                        color_id: req.body.color_id
                    })
                        .then(product => {
                            product.addColors(req.body.colors);
                        })
                        .then(() => {
                            return res.redirect('/admin');
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.render('error');
                        })
                })
        }
    },

    productDetail: (req, res) => {
        // ******** versión sin BD ********
        // let product = Product.findById(req.params.id);

        // return res.render ('./admin/productDetailAdmin', {product, toThousand});
        // *************************

        db.Products.findByPk(req.params.id)
            .then(product => {
                return res.render('./admin/productDetailAdmin', { product, toThousand });
            })
            .catch((error) => {
                console.log(error);
                return res.render('error');
            })

    },

    edit: function (req, res) {
        // ******** versión sin BD ********
        // let categories = Category.findAll();

        // let product = Product.findById (req.params.id);

        // return res.render('./admin/modifyProduct', {product, categories});
        // *****************************

        let getColors = db.Colors.findAll({
            order: [['name']]
        });
        let getProductCategories = db.Product_Categories.findAll();
        let getProduct = db.Products.findByPk(req.params.id, {
            include: [{ association: 'colors' }]
        });

        Promise.all([getProductCategories, getProduct, getColors])
            .then(([categories, product, colors]) => {
                req.session.product = product;
                return res.render('./admin/modifyProduct', { product: product, categories, colors });
            })
            .catch((error) => {
                console.log(error);
                return res.render('error');
            })

    },

    update: function (req, res) {
        // ******** versión sin BD ********
        // let products = Product.findAll();

        // products.forEach(valor=>{
        //     if (valor.id==req.params.id){
        //         valor.name=req.body.name;
        //         valor.description=req.body.description;
        //         valor.category=req.body.category;
        //         valor.price= parseInt(req.body.price);
        //         valor.discount = req.body.discount = ''? 0 : parseInt(req.body.discount);
        //         valor.special = req.body.special? 1:0;
        //     }
        // });

        // let categoryName = Category.findById(req.body.category).name;

        // if (req.file){
        //     products.forEach(valor=>{
        //         if (valor.id==req.params.id){
        //     valor.image= '/images/products/' + categoryName + '/' + req.file.filename;
        //         }
        //     });
        // }
        //          
        // Product.writeFile (products);
        //
        // return res.redirect('/admin');
        // *****************************

        //********** COMIENZO AGREGADO POR MB PARA PROBAR VALIDACIÓN DE ARCHIVO EN MULTER  */

        // Crea un objeto old que contenga los datos ingresados por el usuario. Agrega el id porque no está en el req.body//

        let old = req.body;
        old.id = req.params.id;

        let colorsArray = [];

        // Creo el objeto oldColors para poder usarlo en la vista, si hay errores 
        // Crea el array colorArray para que sea usado al actualizar la BD

        if (!Array.isArray(req.body.colors)) {
            colorsArray = [req.body.colors];
            old.colors = [{ id: req.body.colors }]
        } else {
            colorsArray = req.body.colors;
            let oldColors = [];
            req.body.colors.forEach(color => {
                oldColors.push({ id: color });
            })
            old.colors = oldColors;
        };

        if (resultValidations.errors.length > 0 || req.imgError) {
            const errors = resultValidations.mapped()
            if (req.imgError)
                res.locals.imgError = req.imgError;

            let getColors = db.Colors.findAll({
                order: [['name']]
            });
            let getProductCategories = db.Product_Categories.findAll();

            Promise.all([getProductCategories, getColors])
                .then(([categories, colors]) => {
                    return res.render('./admin/modifyProduct', { categories, colors, product: old, errors });
                })
                .catch((error) => {
                    console.log(error);
                    return res.render('error');
                })
        } else {
            //********** FIN AGREGADO POR MB PARA PROBAR VALIDACIÓN DE ARCHIVO EN MULTER  */

            let imgName;
            let productColors = req.body.colors;

            if (req.file) {
                // remove word "public" from destination 
                imgName = req.file.destination.substring(6) + '/' + req.file.filename;

            } else {
                imgName = req.session.product.img;
            };

            db.Products.findByPk(req.params.id,
                {
                    where: {
                        id: { [Op.eq]: req.params.id }
                    }
                },
                {
                    include: [{ association: 'colors' }]
                })
                .then(product => {
                    db.Products.update({
                        name: req.body.name,
                        description: req.body.description,
                        price: req.body.price,
                        discount: req.body.discount,
                        special: req.body.special ? 1 : 0,
                        img: imgName,
                        category_id: req.body.category_id
                    },
                        {
                            where: {
                                id: { [Op.eq]: req.params.id }
                            }
                        }
                        // ,{
                        //     include: [ {association: 'colors'}] 
                        // }
                    )
                    return product;
                })
                .then(product => {
                    if (productColors) {
                        product.setColors(colorsArray)
                    }
                })
                .then(() => {
                    return res.redirect('/admin');
                })
                .catch((error) => {
                    console.log(error);
                    return res.render('error');
                })
        }
    },

    destroy: function (req, res) {

        // ************ versión sin BD *******
        // let products = Product.findAll();

        // products = products.filter (product => {
        //     return product.id != req.params.id;
        // });

        // Product.writeFile (products);

        // res.redirect ('/admin');
        // *****************************
        db.Product_Colors.destroy({
            where: { product_id: { [Op.eq]: req.params.id } }
        })
            .then(db.Products.destroy({
                where: { id: { [Op.eq]: req.params.id } }
            }))
            .then(() => {
                res.redirect('/admin')
            })
            .catch((error) => {
                console.log(error);
                return res.render('error');
            })

    },

    productsList: (req, res) => {
        // *********** versión sin BD **********
        // let categories = Category.findAll();

        // let products = Product.findAll();

        // res.render('admin/productsListAdmin', {products, toThousand, categories});
        // *******************************
        getProductCategories = db.Product_Categories.findAll();
        getProducts = db.Products.findAll();

        Promise.all([getProductCategories, getProducts])
            .then(([categories, products]) => {
                res.render('admin/productsListAdmin', { products, categories, toThousand });
            })
            .catch((error) => {
                console.log(error);
                return res.render('error');
            })
    },

    filtroPorCategoria: (req, res) => {
        // **************** versión sin BD ***********
        //     let products = Product.findAll();
        //     let categories = Category.findAll();

        //     if (req.body.category ==''){
        //         return  res.render('admin/productsListAdmin', {products, categories});
        // }

        //     const productosFiltrados = products.filter((producto)=>{
        //         return producto.category == req.body.category;
        //     })

        //     return res.render('admin/productsListAdmin', {products: productosFiltrados, categories});
        // ***********************
        let filteredCategory = req.body.category;

        if (filteredCategory == '') {
            getProductCategories = db.Product_Categories.findAll();
            getProducts = db.Products.findAll();
        } else {
            getProductCategories = db.Product_Categories.findAll();
            getProducts = db.Products.findAll({
                where: { category_id: { [Op.eq]: filteredCategory } }
            });
        }

        Promise.all([getProductCategories, getProducts])
            .then(([categories, products]) => {
                res.render('admin/productsListAdmin', { products, categories, toThousand, filteredCategory });
            })
            .catch((error) => {
                console.log(error);
                return res.render('error');
            })
    },

    findUser: (req, res) => {
        res.render('admin/findUser')
    },

    createAdmin: (req, res) => {
        let notFound = 'No existe ningún usuario con ese email'
        db.Users.findOne({
            where: {
                email: req.body.email
            }
        }).then(user => {
            if (user != null) {
                res.render('admin/createAdmin', { user })
            } else {
                res.render('admin/findUser', { notFound, old: req.body })
            }

        })
    },

    saveAdmin: (req, res) => {
        db.Users.update({
            category_id: req.body.category_id
        }, {
            where: {
                id: req.params.id
            }
        }).then(admin => {
            res.redirect('/admin')
        })
    }
}


module.exports = controller;