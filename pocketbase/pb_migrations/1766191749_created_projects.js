/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // UP MIGRATION

  // Create new collections
  const collection_projects_create = new Collection({
    name: "projects",
    type: "base",
    listRule: "@request.auth.id != \"\"",
    viewRule: "@request.auth.id != \"\" && (User = @request.auth.id || SubscriberUsers ?= @request.auth.id)",
    createRule: "@request.auth.id != \"\"",
    updateRule: "@request.auth.id != \"\" && User = @request.auth.id",
    deleteRule: "@request.auth.id != \"\" && User = @request.auth.id",
    manageRule: null,
    fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "text",
      required: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      values: ["draft", "active", "complete", "fail"],
    },
    {
      name: "summary",
      type: "text",
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
    {
      name: "SubscriberUsers",
      type: "relation",
      required: true,
      collectionId: "_pb_users_auth_",
      maxSelect: 999,
      minSelect: 0,
      cascadeDelete: false,
    },
  ],
    indexes: [],
  });

  return app.save(collection_projects_create);

}, (app) => {
  // DOWN MIGRATION (ROLLBACK)

  // Delete created collections
  const collection_projects_rollback = app.findCollectionByNameOrId("projects");
  return app.delete(collection_projects_rollback);

});
