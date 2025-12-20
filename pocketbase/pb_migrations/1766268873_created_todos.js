/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // UP MIGRATION

  // Create new collections
  const collection_todos_create = new Collection({
    name: "todos",
    type: "base",
    listRule: "@request.auth.id != \"\" && User = @request.auth.id",
    viewRule: "@request.auth.id != \"\" && User = @request.auth.id",
    createRule: "@request.auth.id != \"\"",
    updateRule: "@request.auth.id != \"\" && User = @request.auth.id",
    deleteRule: "@request.auth.id != \"\" && User = @request.auth.id",
    manageRule: null,
    fields: [
    {
      name: "id",
      type: "text",
      required: true,
      autogeneratePattern: "[a-z0-9]{15}",
      hidden: false,
      id: "text3208210256",
      max: 15,
      min: 15,
      pattern: "^[a-z0-9]+$",
      presentable: false,
      primaryKey: true,
      system: true,
    },
    {
      name: "created",
      type: "autodate",
      required: true,
      hidden: false,
      id: "autodate2990389176",
      onCreate: true,
      onUpdate: false,
      presentable: false,
      system: false,
    },
    {
      name: "updated",
      type: "autodate",
      required: true,
      hidden: false,
      id: "autodate3332085495",
      onCreate: true,
      onUpdate: true,
      presentable: false,
      system: false,
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "text",
      required: false,
    },
    {
      name: "completed",
      type: "bool",
      required: false,
    },
    {
      name: "User",
      type: "relation",
      required: true,
      collectionId: "_pb_users_auth_",
      maxSelect: 1,
      minSelect: 0,
      cascadeDelete: false,
    },
  ],
    indexes: [],
  });

  return app.save(collection_todos_create);

}, (app) => {
  // DOWN MIGRATION (ROLLBACK)

  // Delete created collections
  const collection_todos_rollback = app.findCollectionByNameOrId("todos");
  return app.delete(collection_todos_rollback);

});
