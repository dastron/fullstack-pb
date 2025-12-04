/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_1780811710");

    // update collection data
    unmarshal(
      {
        indexes: ["CREATE INDEX `idx_gSNqhBRErC` ON `edit_collection_add_index` (`add_number_column`)"],
      },
      collection
    );

    // add field
    collection.fields.addAt(
      1,
      new Field({
        hidden: false,
        id: "number2384605670",
        max: null,
        min: null,
        name: "add_number_column",
        onlyInt: false,
        presentable: false,
        required: false,
        system: false,
        type: "number",
      })
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pbc_1780811710");

    // update collection data
    unmarshal(
      {
        indexes: [],
      },
      collection
    );

    // remove field
    collection.fields.removeById("number2384605670");

    return app.save(collection);
  }
);
