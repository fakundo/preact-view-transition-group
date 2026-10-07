# preact-view-transition-group

**[Demo and docs](https://fakundo.github.io/preact-view-transition-group/)**

Animate Preact children as they are added, removed, moved and resized with native,
element-scoped View Transitions (see [Browser support](#browser-support)). Two APIs:

- `ViewTransitionGroup` — a component, animates changes of its children's keys and order;
- `useViewTransitionGroup` — a hook, `[rootRef, startTransition]`, animates any change made
  inside `startTransition`.

Options (component props and hook options): `childVtClass`, `rootVtClass`, `disabled`,
`respectReducedMotion` (default `true`: no transition when the user prefers reduced motion),
`onTransitionStart`, `onTransitionEnd`. `startTransition(update, { types })` returns the
`ViewTransition` or `null`; the component sets the types `add`, `remove` and `move` by itself.

The Preact port of [react-view-transition-group](../react-view-transition-group): the same API,
options and behavior.

## Preact specifics

- **Preact 11.** `ref` is a regular prop of function components, so `ref` on
  `ViewTransitionGroup` reaches the root element without `forwardRef`. A component passed to `as`
  must pass its `ref` prop to a DOM element.
- **No `preact/compat`.** Preact renders state updates in a microtask, but the update must be
  in the DOM before the new snapshot. The library renders it at once by catching the render
  queue with `options.debounceRendering` for the time of the update: the same way
  `flushSync` of `preact/compat` works, without bringing the compat layer.
- **Only `preact` and `preact/hooks`** are imported, both are peer dependencies.

## Development

```
src/
  ViewTransitionGroup.tsx     — the component (built on the hook)
  useViewTransitionGroup.ts   — the hook
  constants.ts, helpers.ts    — helpers include the synchronous render (`flushSync`)
  *.test.tsx, testUtils.ts    — unit tests (jsdom)
  index.ts                    — library exports
demo/                         — docs page with live examples (main.tsx, examples/)
e2e/                          — browser tests: groups.spec.ts and the test app in app/
vite.config.ts                — library build, dev server and unit tests
playwright.config.ts          — e2e tests in Chromium of Playwright (E2E_CHANNEL: installed one)
.github/workflows/ci.yml      — CI on every push and pull request
```

| Command              | What it does                                               |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Docs at http://localhost:5176                              |
| `npm test`           | Unit tests                                                 |
| `npm run test:e2e`   | E2E tests (once before: `npx playwright install chromium`) |
| `npm run build`      | Type check and build to `dist/` (ESM + CJS + `.d.ts`)      |
| `npm run build:demo` | Docs build to `demo-dist/`                                 |

Git hooks (husky, set up by `npm install`): `pre-commit` formats the staged files with oxfmt
and lints them with oxlint (lint-staged), `commit-msg` checks the message with commitlint.
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat: ...`, `fix(hook): ...`, `docs: ...`). CI checks every pushed commit message, runs the
linter, the format check, unit tests, e2e tests in Chromium and both builds.
After all checks of a push to the default branch it publishes the demo to GitHub Pages (once:
Settings → Pages → Source: GitHub Actions).

## Browser support

The library is built on element-scoped View Transitions (`element.startViewTransition()`).
Browsers without them run the same update at once, without animation: nothing breaks, the Preact
code stays the same.

Which browsers support them: see the
[browser compatibility table on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition#browser_compatibility).

## Limitations

- Preact 11 only: in Preact 10 a function component does not get `ref` as a prop.
- No clicks during a transition: the browser leaves the group and all of its children out of
  hit testing until the transition ends, so a quick second click inside the group is lost.
  Keep the animations short.
- A group that is its own scroll container ignores the wheel during a transition, unless this
  CSS is added:

  ```css
  ::view-transition {
    pointer-events: none;
  }
  ```

- With reduced motion updates run without a transition, unless `respectReducedMotion` is
  `false`.
- Nested groups and groups in scroll containers work: transitions run independently and are
  clipped by the scroll container.
- The root can not be a table row group: the browser does not run a transition on a `<tbody>`
  with the table layout. Lay the table out with CSS grid instead.
