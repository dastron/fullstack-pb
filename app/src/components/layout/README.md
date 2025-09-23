# Layout Components

This directory contains reusable layout components for displaying data in various formats.

## Components

### CardPatternSimple

A basic card pattern component for displaying data in a responsive grid layout.

```tsx
import { CardPatternSimple } from "@/components/layout/CardPatternSimple";

<CardPatternSimple data={items} columns={["title", "status"]} prefix="/project" />;
```

### CardPatternInfinite

An advanced card pattern component with infinite scroll support, real-time subscriptions, and comprehensive state management.

#### Features

- ✨ **Infinite Scrolling**: Automatically loads more items as user scrolls
- 🔄 **Real-time Updates**: Subscribes to live data changes
- 📱 **Responsive Design**: Adapts to different screen sizes
- 🎯 **Optimistic Updates**: Immediate UI feedback for user actions
- 🔍 **Empty States**: Customizable empty and error state displays
- 🐛 **Debug Mode**: Development debugging information
- ⚡ **Performance Optimized**: Efficient rendering and memory usage

#### Basic Usage

```tsx
import { CardPatternInfinite } from "@/components/layout/CardPatternInfinite";

function ProjectList() {
  const loaderData = useLoaderData() as ProjectListLoaderData;

  return (
    <CardPatternInfinite
      loaderData={loaderData}
      columns={["title", "status", "created", "_action"]}
      prefix="/project"
    />
  );
}
```

#### Advanced Usage

```tsx
import { CardPatternInfinite } from "@/components/layout/CardPatternInfinite";

function AdvancedProjectList() {
  const loaderData = useLoaderData() as ProjectListLoaderData;
  const toast = useToast();

  return (
    <CardPatternInfinite
      loaderData={loaderData}
      columns={["title", "status", "created", "_action"]}
      prefix="/project"
      gridColumns={{ base: 1, md: 2, lg: 3, xl: 4 }}
      maxWidth="1400px"
      spacing={6}
      showDebug={process.env.NODE_ENV === "development"}
      listDataOptions={{
        enableSubscription: true,
        infiniteScrollOptions: {
          threshold: 200,
          onLoadMore: (page, totalLoaded) => {
            console.log(`Loaded page ${page}, total: ${totalLoaded}`);
          },
          onReachEnd: () => {
            console.log("Reached end of list");
          },
        },
        onItemAdded: (item) => {
          toast({
            title: "New Item Added",
            description: `"${item.title}" was created`,
            status: "success",
          });
        },
        onSubscriptionError: (error) => {
          toast({
            title: "Connection Error",
            description: "Lost real-time connection",
            status: "warning",
          });
        },
      }}
      emptyComponent={
        <Stack spacing={4} align="center" py={12}>
          <Heading size="md" color="gray.500">
            No Items Yet
          </Heading>
          <Button colorScheme="blue">Create First Item</Button>
        </Stack>
      }
    />
  );
}
```

#### Props

| Prop               | Type                | Default                     | Description                  |
| ------------------ | ------------------- | --------------------------- | ---------------------------- |
| `loaderData`       | `ListLoaderData<T>` | Required                    | Data from route loader       |
| `columns`          | `string[]`          | Required                    | Column names to display      |
| `prefix`           | `string`            | `""`                        | URL prefix for navigation    |
| `gridColumns`      | `object`            | `{ base: 1, md: 2, lg: 3 }` | Responsive grid columns      |
| `maxWidth`         | `string`            | `"1200px"`                  | Maximum container width      |
| `spacing`          | `number`            | `6`                         | Grid item spacing            |
| `listDataOptions`  | `object`            | `{}`                        | Options for useListData hook |
| `loadingComponent` | `ReactNode`         | Default spinner             | Custom loading indicator     |
| `emptyComponent`   | `ReactNode`         | Default empty state         | Custom empty state           |
| `errorComponent`   | `ReactNode`         | Default error alert         | Custom error display         |
| `showDebug`        | `boolean`           | `false`                     | Show debug information       |

#### List Data Options

The `listDataOptions` prop accepts configuration for the underlying `useListData` hook:

```tsx
listDataOptions={{
  enableSubscription: true, // Enable real-time updates
  infiniteScrollOptions: {
    threshold: 200, // Distance from bottom to trigger loading
    onLoadMore: (page, totalLoaded) => {},
    onReachEnd: () => {},
  },
  onItemAdded: (item) => {},
  onItemUpdated: (item) => {},
  onItemRemoved: (itemId) => {},
  onSubscriptionError: (error) => {},
}}
```

### SimpleCardPatternInfinite

A simplified version of `CardPatternInfinite` for basic use cases:

```tsx
import { SimpleCardPatternInfinite } from "@/components/layout/CardPatternInfinite";

<SimpleCardPatternInfinite loaderData={loaderData} columns={["title", "status"]} prefix="/project" />;
```

### CardPatternItem

The individual card component used by both `CardPatternSimple` and `CardPatternInfinite`. Handles:

- Image thumbnails with fallbacks
- Field rendering with special handling for dates
- Navigation links
- Action buttons
- Responsive design

### TablePattern & TablePatternItem

Table-based layout components for structured data display.

## Best Practices

1. **Choose the Right Component**:

   - Use `CardPatternSimple` for small, static datasets
   - Use `CardPatternInfinite` for large datasets or when real-time updates are needed

2. **Column Configuration**:

   - Include `"_action"` in columns to show action buttons
   - Date columns (`created`, `updated`, `expired`) are automatically formatted
   - Column names are automatically formatted (underscores become spaces)

3. **Performance**:

   - `CardPatternInfinite` includes built-in optimizations
   - Use appropriate `threshold` values for infinite scroll (100-300px recommended)
   - Enable subscriptions only when needed

4. **Error Handling**:

   - Always provide `onSubscriptionError` callback for production apps
   - Use custom error components for better user experience
   - Handle network failures gracefully

5. **Accessibility**:
   - All components include proper ARIA labels
   - Keyboard navigation is supported
   - Screen reader compatibility maintained

## Migration Guide

### From CardPatternSimple to CardPatternInfinite

```tsx
// Before
<CardPatternSimple
  data={projects}
  columns={["title", "status"]}
  prefix="/project"
/>

// After
<CardPatternInfinite
  loaderData={loaderData}
  columns={["title", "status"]}
  prefix="/project"
  listDataOptions={{
    enableSubscription: true,
  }}
/>
```

Note: You'll need to update your page to use `useLoaderData()` instead of passing data directly.
