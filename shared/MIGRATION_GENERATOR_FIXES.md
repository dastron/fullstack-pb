# Migration Generator Fixes

## Issues Fixed

### 1. Incorrect PocketBase API Usage
**Problem**: Generated migrations were using `app` instead of `app` parameter.

**Root Cause**: The PocketBase JavaScript migration API uses `app` as the parameter passed to the migrate function, not the global `app` variable.

**Fix**: Updated all code generation functions to use `app` instead of `app`:
- `generateCollectionCreation()` - Changed `app.save()` to `app.save()`
- `generateFieldAddition()` - Changed `app.findCollectionByNameOrId()` to `app.findCollectionByNameOrId()`
- `generateFieldModification()` - Changed `app` references to `app`
- `generateFieldDeletion()` - Changed `app` references to `app`
- `generateIndexAddition()` - Changed `app` references to `app`
- `generateIndexRemoval()` - Changed `app` references to `app`
- `generateRuleUpdate()` - Changed `app` references to `app`
- `generatePermissionUpdate()` - Changed `app` references to `app`
- `generateCollectionDeletion()` - Changed `app` references to `app`
- `generateFieldDefinitionObject()` - Changed relation field collection ID resolution
- `generateFieldConstructorOptions()` - Changed relation field collection ID resolution

### 2. Variable Name Conflicts
**Problem**: When creating multiple collections, all used `const collection`, causing "Cannot redeclare block-scoped variable" errors.

**Root Cause**: The generator was using a hardcoded variable name for all collections.

**Fix**: 
- Updated `generateCollectionCreation()` to accept a `varName` parameter
- Updated `generateCollectionDeletion()` to accept a `varName` parameter
- Modified `generateUpMigration()` to use unique variable names (`collection1`, `collection2`, etc.) when creating multiple collections
- Modified `generateDownMigration()` to use unique variable names when deleting multiple collections

## Files Modified

- `shared/src/migration/generator.ts` - All code generation functions updated

## Testing

Generated a fresh migration with 2 collections (projects and users):
- ✅ No variable name conflicts
- ✅ Correct use of `app` parameter
- ✅ No TypeScript/JavaScript errors
- ✅ Both up and down migrations properly structured

## Example Output

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // UP MIGRATION

  // Create new collections
  const collection1 = new Collection({
    name: "projects",
    type: "base",
    // ... fields
  });

  app.save(collection1);

  const collection2 = new Collection({
    name: "users",
    type: "auth",
    // ... fields
  });

  app.save(collection2);

  return true;
}, (app) => {
  // DOWN MIGRATION (ROLLBACK)

  // Delete created collections
  const collection1 = app.findCollectionByNameOrId("projects");
  app.delete(collection1);

  const collection2 = app.findCollectionByNameOrId("users");
  app.delete(collection2);

  return true;
});
```

## Related Documentation

- PocketBase Migration Doc: `.kiro/steering/Pocketbase Migration Doc.md`
- PocketBase Collection Operations: `.kiro/steering/PocketBase Collection Operations Doc.md`
- Schema-Driven Migrations Guide: `shared/MIGRATION_GUIDE.md`
