'use strict';

const knex = require('../knex');

let searchTerm = 'gaga';
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .orderBy('notes.id')
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
  })
  .catch(err => {
    console.error(err);
  });

//GET by ID

let searchId = 1001;
knex
  .select('notes.id', 'title', 'content')
  .from('notes')
  .modify(queryBuilder => {
    if (searchId){
      queryBuilder.where(searchId, 'notes.id');
    }
  })
  .then(result => {
    console.log(result[0]);
  })
  .catch(err => {
    console.error(err);
  });


//PUT by ID

let updateId = 1002;
let updateObj = {};

knex
  .update(updateObj)
  .from('notes')
  .where('notes.id', updateId)
  .then(result => {
    res.json(result[0]);
  })
  .catch(err => {
    console.error(err);
  })

//POST request

let newObj = {};

knex
  .insert(newObj)
  .from('notes')
  .returning('notes.id', 'title', 'content')
  .then(result => {
    res.json(result[0]);
  })
  .catch(err => {
    console.error(err);
  });

//DELETE request

let deleteId = 1000;

knex
  .delete()
  .from('notes')
  .where('notes.id', deleteId)
  .then(result => {
    console.log(result[0]);
  })
  .catch(err => {
    console.error(err);
  })





