/**
 * Fixture: Collection with All Field Types
 *
 * Purpose: Tests that the migration generator correctly handles all PocketBase field types
 *
 * Expected Behavior:
 * - Generates a collection with text, editor, number, bool, email, url, date, select, file, relation, json, and geoPoint fields
 * - All field type-specific properties are correctly mapped
 * - Base fields (id, created, updated) are included
 * - Collection has null permissions (superuser-only access)
 *
 * Validates Requirements: 1.1, 3.1-3.13
 */

import type { CollectionSchema, FieldDefinition } from "../../../types";

export const createCollectionWithColumnsName = "create_new_collection_with_columns";
export const createCollectionWithColumnsType = "base" as const;

// Define fields matching the reference migration
export const createCollectionWithColumnsFields: FieldDefinition[] = [
  {
    name: "plain_text_column",
    type: "text",
    required: false,
    options: {},
  },
  {
    name: "rich_text_column",
    type: "editor",
    required: false,
    options: {},
  },
  {
    name: "number_column",
    type: "number",
    required: false,
    options: {},
  },
  {
    name: "bool_column",
    type: "bool",
    required: false,
    options: {},
  },
  {
    name: "email_column",
    type: "email",
    required: false,
    options: {},
  },
  {
    name: "url_column",
    type: "url",
    required: false,
    options: {},
  },
  {
    name: "datetime_column",
    type: "date",
    required: false,
    options: {},
  },
  {
    name: "select_column",
    type: "select",
    required: false,
    options: {
      values: ["a_select_option", "b_select_option"],
      maxSelect: 1,
    },
  },
  {
    name: "file_column",
    type: "file",
    required: false,
    options: {
      maxSelect: 1,
      maxSize: 0,
      mimeTypes: [],
      thumbs: [],
      protected: false,
    },
  },
  {
    name: "relation_to_users_column",
    type: "relation",
    required: false,
    options: {},
    relation: {
      collection: "users",
      maxSelect: 1,
      minSelect: 0,
      cascadeDelete: false,
    },
  },
  {
    name: "json_column",
    type: "json",
    required: false,
    options: {},
  },
  {
    name: "geopoint_column",
    type: "geoPoint",
    required: false,
    options: {},
  },
  {
    name: "autodate_column",
    type: "autodate",
    required: false,
    options: {
      onCreate: true,
      onUpdate: false,
    },
  },
];

export const CreateCollectionWithColumnsSchema: CollectionSchema = {
  name: createCollectionWithColumnsName,
  type: createCollectionWithColumnsType,
  fields: createCollectionWithColumnsFields,
  indexes: [],
  permissions: {
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  },
};
