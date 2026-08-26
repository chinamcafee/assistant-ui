# Wenchuan Tech assistant-ui fork

## Git model

- `upstream`: read-only `assistant-ui/assistant-ui` remote.
- `origin`: writable `chinamcafee/assistant-ui` fork.
- `main`: the only long-lived stable company line.
- `integration/upstream-YYYYMMDD`: temporary upstream synchronization branches.
- `feature/*` and `fix/*`: internal review branches.
- `upstream-base-20260826`: immutable initial company baseline tag.

## Package and product isolation

Upstream source workspaces normally keep their original names. `pnpm company:stage` builds the approved closure and produces company-only publish directories under `.company-release`. Internal applications consume only staged `@wenchuantech` packages and never follow upstream releases directly.

The company CLI is invoked as:

```bash
npx @wenchuantech/assistant-ui@latest init
npx @wenchuantech/assistant-ui@latest add thread
npm create @wenchuantech/assistant-ui
```

Command grammar remains compatible with upstream. Templates are restricted by `company/release-allowlist.json`, downloaded only from the company repository, and transformed so package manifests contain company identities.

## Validation

Run `pnpm company:verify`, `pnpm company:build`, `pnpm company:stage`, and `pnpm company:test`. Publishing must operate on `.company-release/*`, never directly from an upstream-named workspace.
