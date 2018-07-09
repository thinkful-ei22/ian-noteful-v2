'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');

//GET all folders

router.get('/', (req, res, next) => {
    knex
      .select('folders.name', 'folders.id')
      .from('folders')
      .then(results => {
          res.json(results);
      })
      .catch(err => {
          next(err);
      })
})

//GET folder by ID

router.get('/:id', (req, res, next) => {
    const searchId = req.params.id;
    knex
      .select('name', 'id')
      .from('folders')
      .modify((queryBuilder) => {
        if(searchId){
            queryBuilder.where('folders.id', searchId);
        }
      })
      .then(result => {
          res.json(result[0]);
      })
      .catch(err => {
          next(err);
      })
});

//PUT request for folders....

router.put('/:id', (req, res, next) => {
    const updateId = req.params.id;
    const updateObj = {};
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
      .from('folders')
      .returning('id')
      .where('folders.id', updateId)
      .then(([id]) => {
          return knex
                  .select('folders.name', 'folders.id')
                  .from('folders')
                  .where('folders.id', id)
      })
      .then(result => {
          res.json(result[0]);
      })
      .catch(err => {
          next(err);
      })
});

//POST: create a new folder........

router.post('/', (req, res, next) => {
    const { name } = req.body;
    const newFolder = { name };
    if (!newFolder.name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
      }
    knex
      .insert(newFolder)
      .returning(['name', 'folders.id'])
      .from('folders')
      .then(result => {
        res.json(result[0]);
      })
      .catch(err => {
          next(err);
      })
});

//DELETE: delete a folder........

router.delete('/:id', (req, res, next) => {
    const deleteId = req.params.id;
    knex
      .delete()
      .from('folders')
      .where('folders.id', deleteId)
      .then(result => {
          res.json(result[0]);
      })
      .catch(err => {
          next(err);
      })
});




module.exports = router;