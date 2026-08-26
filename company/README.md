# Wenchuan Tech assistant-ui fork

This fork keeps upstream package identities in most source workspaces so upstream updates remain reviewable. Company releases are staged through `pnpm company:stage`; the staging process rewrites package identities, dependency edges, built imports, source files, repository metadata, and versions into the `@wenchuantech` namespace.

The authoritative naming rule is `package-map.json`. The release and template closure is `release-allowlist.json`. A package is never published merely because it exists upstream: it must be present in the allowlist and all of its internal runtime dependencies must also be present.

The three CLI workspaces and company-owned protocol/runtime workspaces use company identities directly because they are the isolation boundary exposed to internal applications. CLI command names and flags stay aligned with upstream; only the executable package name, repository, registry, generated package dependencies, and support identity differ.

`@wenchuantech/assistant-runtime-agui` is optional. It translates AG-UI event streams into the stable Wenchuan protocol and depends on the company protocol/runtime rather than defining application UI. Mobile visual interaction remains in the gluestack fork; Web and Electron may consume staged assistant-ui React packages.
