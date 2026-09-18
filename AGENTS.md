- Do not edit index.css
- Do not edit vite.config.ts
- UI must follow shadcn "lyra" design system.
- always refer to requirements in plan.md and req.md
- Do not manually create shadcn components. Use the shadcn cli to generate components. Do not edit the generated components manually. Always use the shadcn cli to update the components.


# Clean Code

## Goal

Write simple, maintainable, idiomatic production code.

## Principles

* Prefer the simplest implementation that satisfies the requirement.
* Do not introduce abstractions unless they remove real duplication or complexity.
* Keep functions focused on one responsibility.
* Use descriptive names instead of comments explaining unclear names.
* Prefer early returns over deeply nested control flow.
* Avoid unnecessary wrappers, factories, helpers, and utility modules.
* Follow existing project conventions before inventing new patterns.
* Do not refactor unrelated code.
* Avoid premature optimization.
* Prefer explicit code over clever code.
* Keep public APIs small.
* Delete dead code instead of commenting it out.

## Single Source of Truth

Avoid defining the same information in multiple places.

Before creating a new type, interface, schema, constant, enum, helper, validator, configuration object, or mapping:

1. Search the codebase for an existing equivalent.
2. Reuse or derive from the existing definition where appropriate.
3. Extend the existing definition if the concepts are genuinely the same.
4. Only create a separate definition when the concepts have meaningfully different responsibilities.

Do not duplicate:

* TypeScript types or interfaces that represent the same data.
* API request/response types already generated or defined elsewhere.
* Validation schemas and corresponding manually duplicated types when the type can be inferred.
* Constants, enums, route names, status values, feature flags, or configuration keys.
* Formatting, parsing, transformation, filtering, or validation logic.
* Business rules across components, hooks, services, controllers, or utilities.
* Static mappings that can be derived from an existing source.
* State that can be derived from other state.

Prefer derivation over synchronization.

For example:

```ts
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
})

type User = z.infer<typeof userSchema>
```

Prefer this over separately maintaining:

```ts
interface User {
  id: string
  name: string
}

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
})
```

unless there is a specific architectural reason they must be independent.

## Reuse Existing Code

Before implementing new logic:

1. Search for similar functionality elsewhere in the repository.
2. Check existing utilities, hooks, components, services, schemas, and types.
3. Reuse existing behavior when its semantics match.
4. Avoid creating a second implementation with slightly different naming.

If two implementations perform the same business operation, prefer consolidating them rather than allowing both to evolve independently.

Do not extract shared code merely because two small pieces of code look similar. Extract only when they represent the same concept or behavior.

## Types

* Do not create duplicate domain types.
* Prefer importing canonical types from their owning module.
* Prefer deriving narrower types with `Pick`, `Omit`, indexed access types, or equivalent language features when appropriate.
* Prefer types generated from API schemas, database schemas, or validators when those are authoritative.
* Avoid broad types such as `any`, `unknown`, or generic records when a precise existing type is available.
* Do not redefine third-party library types locally unless adaptation is necessary.
* Keep domain types close to the domain they represent.

Example:

```ts
type UserId = User["id"]

type UserPreview = Pick<User, "id" | "name">
```

instead of manually redefining those structures.

## Business Logic

Business rules should have one clear owner.

Avoid implementing the same rule independently in:

* UI components
* hooks
* API handlers
* services
* background jobs
* validation code

When several layers need the same rule, place it in the appropriate shared domain layer and call it from each consumer.

UI code should generally consume business logic rather than recreate it.

## Derived State

Do not store state that can be calculated cheaply from existing state.

Prefer:

```ts
const completedTasks = tasks.filter((task) => task.completed)
```

over maintaining both:

```ts
const [tasks, setTasks] = useState(...)
const [completedTasks, setCompletedTasks] = useState(...)
```

when `completedTasks` is purely derived from `tasks`.

This reduces synchronization bugs and duplicated logic.

## Before Writing Code

1. Read the surrounding implementation.
2. Search the repository for related types, schemas, utilities, components, and business logic.
3. Identify existing patterns that solve similar problems.
4. Determine the canonical source of truth for the data or behavior being changed.
5. Reuse existing definitions where appropriate.
6. Determine the smallest change required.

## While Writing Code

Continuously check:

* Am I recreating something that already exists?
* Is this value already represented somewhere else?
* Can this type be derived from an existing type?
* Can this state be derived instead of stored?
* Am I duplicating a business rule?
* Am I creating another source of truth that will need to stay synchronized?

If yes, prefer reuse or derivation.

## After Writing Code

Review the diff and ask:

* Can any abstraction be removed?
* Did I introduce unnecessary complexity?
* Are names understandable without comments?
* Is any function doing too many things?
* Did I duplicate an existing project utility?
* Did I duplicate an existing type, schema, constant, or business rule?
* Did I introduce multiple sources of truth?
* Could any new type be derived from an existing canonical type?
* Could any stored state be derived?
* Did I modify anything unrelated?
* Can this implementation be made smaller without becoming obscure?

Search the repository once more for newly introduced identifiers and similar implementations to catch accidental duplication.

Run the project's formatter, linter, type checker, and relevant tests.
