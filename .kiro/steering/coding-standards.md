# Coding Standards

## Before Writing Code
- Read at least 5 related files before implementing any feature
- Understand existing patterns before adding new code

## Database Rules
- NEVER make database calls inside loops
- NEVER write direct SQL queries - always use `db` methods from `src/modules/database.ts`
- All database columns must be in snake_case
- Use transactions for multi-step operations

## File Reading
- Use `src/config/file.config.ts` for all consistent file reads
- Don't read files directly with fs unless absolutely necessary

## Code Style
- Keep controllers short and focused
- Avoid creating unnecessary controllers or utils
- Use early returns instead of nested if-else:
```typescript
// BAD
if (condition) {
  // lots of code
} else {
  return error;
}

// GOOD
if (!condition) {
  return error;
}
// lots of code
```

## Typing
- All code must be properly typed
- No `any` unless absolutely necessary
- Define interfaces for all data structures

## Package Management
- NEVER modify package.json directly
- Run `npm install <package>` to add dependencies

## Documentation
- Don't create documentation unless asked
- If asked, use curl format only:
```
POST /api/endpoint
Body: { "field": "value" }
Response: { "status": true, "data": {} }
Explanation: Brief description for frontend dev
```
