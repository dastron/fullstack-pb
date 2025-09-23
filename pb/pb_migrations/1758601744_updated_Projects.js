/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3853224427")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "file1760294360",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "imageFiles",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3853224427")

  // remove field
  collection.fields.removeById("file1760294360")

  return app.save(collection)
})
