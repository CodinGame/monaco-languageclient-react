# @codingame/monaco-languageclient-react &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-languageclient-react)](https://www.npmjs.com/package/@codingame/monaco-languageclient-react) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-languageclient-react.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-languageclient-react) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-languageclient-react/pulls)

### Installation

```bash
npm install @codingame/monaco-languageclient-react 
```

### Usage

#### Simple usage

You just need to import and render the `LanguageClient` component:

```typescript
import React from "react";

import LanguageClient from "@codingame/monaco-languageclient-react";

function LanguageClientContainer() {
  return (
   <LanguageClient
     languageServerConfig={...}
     getSecurityToken={...}
     languageServerUrl={...}
   />
  );
}
```
