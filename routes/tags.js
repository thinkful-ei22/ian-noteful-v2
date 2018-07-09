'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

//GET ALL tags...............
router.get('/', (req, res, next) => {
    knex
      .select('name', 'id')
      .from('tags')
      .then(results => {
          res.json(results);
      })
      .catch(err => next(err));
});

//GET by ID.............
router.get('/:id', (req, res, next) => {
    let searchId = req.params.id;
    knex
      .select('name', 'id')
      .from('tags')
      .modify(queryBuilder => {
          if(searchId){
              queryBuilder.where('tags.id', searchId);
          }
      })
      .then(results => {
          res.json(results[0]);
      })
      .catch(err => next(err));
});

//POST a new tag...............
router.post('/tags', (req, res, next) => {
    const { name } = req.body;
  
    /***** Never trust users. Validate input *****/
    if (!name) {
      const err = new Error('Missing `name` in request body');
      err.status = 400;
      return next(err);
    }
  
    const newItem = { name };
  
    knex.insert(newItem)
      .into('tags')
      .returning(['id', 'name'])
      .then((results) => {
        // Uses Array index solution to get first item in results array
        const result = results[0];
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
      })
      .catch(err => next(err));
  });

//PUT: update and existing tag..............
router.put('/:id', (req, res, next) => {
    const updateObj = {};
    const updateId = req.params.id;
    //never trust anyone................
    const updateKey = 'name';
    if(updateKey in req.body){
        updateObj.name = req.body.name;
    }
    if (!updateObj.name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
    }
    knex
      .update(updateObj)
      .from('tags')
      .returning('id')
      .where('tags.id', updateId)
      .then(([id]) => {
          return knex
                  .select('tags.name', 'tags.id')
                  .from('tags')
                  .where('tags.id', id)
      })
      .then(results => {
          res.json(results[0]);
      })
      .catch(err => next(err));
});

//DELETE remove a tag with ID

router.delete('/:id', (req, res, next) => {
    let deleteId = req.params.id;
    knex
      .delete()
      .from('tags')
      .where('tags.id', deleteId)
      .then(results => {
          res.json(results);
      })
      .catch(err => next(err));
});


module.exports = router;