# Schema Package

This package contains shared [Zod](https://github.com/colinhacks/zod) schemas for use across the project. These schemas provide runtime validation and TypeScript type inference.

## Usage

### Building the Package

```bash
# Install dependencies
yarn install

# Build the package
yarn build

# Start development mode with watch
yarn dev
```

### Using in Other Projects

#### 1. As a Local Package

Add this package to your project's package.json:

```json
{
  "dependencies": {
    "schema": "workspace:*"
  }
}
```

Make sure your project is using Yarn workspaces for local dependencies.

#### 2. Importing Schemas

```typescript
import { todoSchema, type Todo, createTodoSchema, updateTodoSchema } from 'schema';

// Validate data with the schema
const validatedData = todoSchema.parse({
  title: 'Complete project',
  description: 'Finish the project by Friday',
  completed: false
});

// Use the type
const newTodo: Todo = {
  id: '123',
  title: 'New task',
  completed: false
};

// Use the create schema for form validation
const createData = createTodoSchema.parse({
  title: 'Task name',
  description: 'Task description'
});
```

## Available Schemas

- `todoSchema`: Defines the structure of a Todo item
- `createTodoSchema`: Schema for creating a new Todo
- `updateTodoSchema`: Schema for updating an existing Todo

## Adding New Schemas

1. Create a new file in the `src` directory (e.g., `src/user.ts`)
2. Define your schema using Zod
3. Export the schema and any related types
4. Add the export to `src/index.ts` 