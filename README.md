<a href="https://github.com/chinamcafee/assistant-ui">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/header-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/header.svg" />
    <img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/header.svg" alt="assistant-ui Header" width="100%" />
  </picture>
</a>

<p align="center">
  <a href="https://github.com/chinamcafee/assistant-ui">Product</a> ·
  <a href="https://github.com/chinamcafee/assistant-ui/docs">Documentation</a> ·
  <a href="https://github.com/chinamcafee/assistant-ui/examples">Examples</a> ·
  <a href="https://discord.gg/S9dwgCNEFs">Discord</a> ·
  <a href="https://cal.com/simon-farshid/assistant-ui">Contact Sales</a>
</p>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/assistant-ui/assistant-ui)
![GitHub License](https://img.shields.io/github/license/chinamcafee/assistant-ui)
[![GitHub stars](https://img.shields.io/github/stars/chinamcafee/assistant-ui)](https://github.com/chinamcafee/assistant-ui)

## The UX of ChatGPT in your React app 💬🚀

**assistant-ui** is an open-source TypeScript/React library to build production-grade AI chat experiences fast.

> This is the independently maintained Wenchuan Tech fork. Internal applications consume only the controlled `@wenchuantech` release closure. See [COMPANY_FORK.md](./COMPANY_FORK.md) for governance, package isolation, and validation rules. Company packages are not considered released until the protected release workflow publishes them.

## Installation

The fastest path is the CLI, which scaffolds a Next.js app or adds the styled components to an existing project:

```bash
npx @wenchuantech/assistant-ui@latest create   # new project
npx @wenchuantech/assistant-ui@latest init     # add to existing project
```

Or install the packages directly:

```bash
npm install @wenchuantech/assistant-ui-react @wenchuantech/assistant-ui-ai-sdk
```

## Usage

```tsx
"use client";

import { AssistantRuntimeProvider } from "@wenchuantech/assistant-ui-react";
import { useChatRuntime } from "@wenchuantech/assistant-ui-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";

export function Chat() {
  const runtime = useChatRuntime();
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
}
```

`useChatRuntime` connects to the Vercel AI SDK out of the box. Swap it for `useLangGraphRuntime`, `useDataStreamRuntime`, or any custom runtime to integrate with your own backend.

[![assistant-ui starter template](https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/assistant-ui-starter.gif)](https://youtu.be/k6Dc8URmLjk)

## What you get

- **Composable primitives**: build any chat UX from `Thread`, `Message`, `Composer`, `ThreadList`, `ActionBar`, and friends. Style every pixel yourself, or start from a polished shadcn/ui theme that the CLI copies into your project.
- **Production UX out of the box**: streaming, auto-scroll, retries, attachments, markdown, code highlighting, voice dictation, keyboard shortcuts, and accessibility.
- **Generative UI**: render tool calls and JSON as React components, collect inline human approvals, and expose safe frontend actions to the model.
- **Strong TypeScript**: typed runtime APIs, tool schemas, message parts, and adapters end to end.

## Approved company release integrations

| Integration | Package |
| --- | --- |
| Wenchuan Java/Spring AI protocol | `@wenchuantech/assistant-protocol`, `@wenchuantech/assistant-runtime` |
| Vercel AI SDK | `@wenchuantech/assistant-ui-ai-sdk` |
| Next.js | `@wenchuantech/assistant-ui-next` |
| Markdown | `@wenchuantech/assistant-ui-react-markdown` |
| Managed cloud primitives | `@wenchuantech/assistant-cloud` |
| Standard AG-UI event adapter (optional foundation) | `@wenchuantech/assistant-runtime-agui` |

The authoritative package and template boundary is `company/release-allowlist.json`. Other upstream integrations remain source-only until their complete company dependency closure is approved and validated.

## Customization

Instead of a single monolithic chat component, you compose primitives and bring your own styles. The CLI ships a great starter in your choice of Base UI (the default) or Radix UI flavor; you control everything else.

![Overview of components](https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/components.png)

Sample customization to make a Perplexity lookalike:

![Perplexity clone created with assistant-ui](https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/perplexity.gif)

## Upstream project adoption

The organizations below are listed by the upstream project; this fork does not claim that they use or endorse the Wenchuan Tech distribution.

<a href="https://mastra.ai/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Mastra.svg" height="20" alt="Mastra"></a>, <a href="https://langchain.com/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/LangChain.svg" height="20" alt="LangChain"></a>, <a href="https://athenaintelligence.ai/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Athena-Intelligence.svg" height="20" alt="Athena Intelligence"></a>, <a href="https://browser-use.com/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Browser-Use.svg" height="20" alt="Browser Use"></a>, <a href="https://stack-ai.com/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Stack.svg" height="20" alt="Stack"></a>, <a href="https://inconvo.com/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Inconvo.svg" height="20" alt="Inconvo"></a>, <a href="https://iterable.com/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Iterable.svg" height="20" alt="Iterable"></a>, <a href="https://helicone.ai/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/helicone.svg" height="20" alt="Helicone"></a>, <a href="https://getgram.ai/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/gram.svg" height="20" alt="Gram"></a>, <a href="https://coreviz.io/?ref=assistant-ui" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/logos/Coreviz.svg" height="20" alt="Coreviz"></a>, and many more.

![Chart of assistant-ui's traction](https://raw.githubusercontent.com/assistant-ui/assistant-ui/main/.github/assets/traction.png)

## Demos

<table>
  <tr>
    <td align="center">
      <a href="https://youtu.be/ZW56UHlqTCQ">
        <img src="https://img.youtube.com/vi/ZW56UHlqTCQ/hqdefault.jpg" alt="Short Demo" />
      </a>
    </td>
    <td align="center">
      <a href="https://youtu.be/9eLKs9AM4tU">
        <img src="https://img.youtube.com/vi/9eLKs9AM4tU/hqdefault.jpg" alt="Long Demo" />
      </a>
    </td>
  </tr>
</table>

## Upstream community

- [Examples](https://github.com/chinamcafee/assistant-ui/examples)
- [Documentation](https://github.com/chinamcafee/assistant-ui/docs/)
- [Discord](https://discord.com/invite/S9dwgCNEFs)
- [Book a sales call](https://cal.com/simon-farshid/assistant-ui)

## For other platforms

- React Native: [`@wenchuantech/assistant-ui-react-native`](https://www.npmjs.com/package/@wenchuantech/assistant-ui-react-native)
- Terminal (Ink): [`@wenchuantech/assistant-ui-react-ink`](https://www.npmjs.com/package/@wenchuantech/assistant-ui-react-ink)

## License

MIT. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for upstream attribution.

The upstream assistant-ui project is backed by Y Combinator; this statement does not imply endorsement of this fork.
