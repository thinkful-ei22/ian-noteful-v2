'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');

// GET All: (and search by query) and filter with folders
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;
  const { folderId } = req.query;
  const { tagId } = req.query;
  knex
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .leftJoin('notes_tags', 'notes.id', 'note_id')
  .leftJoin('tags', 'tag_id', 'tags.id')
  .modify(queryBuilder => {

    if (searchTerm) {
      queryBuilder.where('title', 'like', `%${searchTerm}%`);
    }
  })
  .modify(queryBuilder => {
    if(folderId) {
      queryBuilder.where('folder_id', folderId);
    }
  })
  .modify(queryBuilder => {
    if(tagId) {
      queryBuilder.where('tag_id', tagId);
    }
  })
  .orderBy('notes.id')
  .then(result => {
    if (result) {
      const hydrated = hydrateNotes(result);
      res.json(hydrated);
    } else {
      next();
    }
  })
  .catch(err => next(err));
});

// GET by ID: a single item and return it and folder info
router.get('/:id', (req, res, next) => {
  const searchId = req.params.id;

  knex
  .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
  .from('notes')
  .leftJoin('folders', 'notes.folder_id', 'folders.id')
  .leftJoin('notes_tags', 'notes.id', 'note_id')
  .leftJoin('tags', 'tag_id', 'tags.id')
  .modify(queryBuilder => {
    if (searchId){
      queryBuilder.where('notes.id', searchId);
    }
  })
  .then(result => {
    if (result) {
      const hydrated = hydrateNotes(result);
      res.json(hydrated);
    } else {
      next();
    }
  })
  .catch(err => next(err));
});

// PUT: update an item with an ID
router.put('/:id', (req, res, next) => {
  const noteId = req.params.id;
  const { title, content, folderId, tags =[] } = req.body;
  const updateObj = {
    title: title,
    content: content,
    folder_id: folderId,
  };

  /***** Never trust users - validate input *****/
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  /***** Never trust users - validate input *****/

  knex
    .update(updateObj)
    .from('notes')
    .where('notes.id', noteId)
    .then(() => {
        knex
          .delete()
          .from('notes_tags')
          .where('note_id', noteId)
    })
    //noteId lost its value????
    .then(() => {
      console.log(`heyyyyyy youuuuu ${noteId}`);
      const tagsInsert = tags.map((tag)=> ({ note_id: noteId, tag_id: tag.id }));
      return knex
              .insert(tagsInsert)
              .into('notes_tags');
    })
    .then(() => {
      return knex
              .select('notes.id', 'title', 'content', 'folder_id as folderId', 'folders.name as folderName', 'tags.name as tagName', 'tags.id as tagId')
              .from('notes')
              .leftJoin('folders', 'notes.folder_id', 'folders.id')
              .leftJoin('notes_tags', 'notes.id', 'note_id')
              .leftJoin('tags', 'tag_id', 'tags.id')
              .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});



// POST: (2 queries) we first insert a new item, then we
//run another query to retrieve the item and folder info 
router.post('/', (req, res, next) => {
  const { title, content, folderId, tagId } = req.body;
  const newObj = { 
    title: title,
    content: content,
    folder_id: folderId
  };

  let noteId;

  /***** Never trust users - validate input *****/
  if (!newObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  /***** Never trust users - validate input *****/

  knex
  .insert(newObj)
  .into('notes')
  .returning('id')
  .then(([id]) => {
    noteId = id;
    const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
    return knex
      .insert(tagsInsert)
      .into('notes_tags');
  })
  .then(() => {
    return knex
      .select('notes.id', 'title', 'content',
      'folders.id as folder_id', 'folders.name as folderName',
      'tags.id as tagId', 'tags.name as tagName')
      .from('notes')
      .leftJoin('folders', 'notes.folder_id', 'folders.id')
      .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
      .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
      .where('notes.id', noteId);
  })
  .then(result => {
    if (result) {
      const hydrated = hydrateNotes(result)[0];
      res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
    } else {
      next();
    }
  })
  .catch(err => next(err));
});


// DELETE: remove an item with ID
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;

  knex
  .delete()
  .from('notes')
  .where('notes.id', id)
  .then(result => {
    res.json(result[0]);
  })
  .catch(err => {
    next(err);
  })
});

module.exports = router;
