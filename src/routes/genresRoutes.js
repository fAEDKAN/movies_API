const express = require('express');
const router = express.Router();
const { list, getByName, getById } = require('../controllers/genresController');

//* /genres
router
    .get('/', list)
    .get('/name/:name?', getByName)
    .get('/:id', getById) //un género en particular

module.exports = router;