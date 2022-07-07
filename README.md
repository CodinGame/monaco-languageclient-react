# @codingame/monaco-languageclient-react &middot; [![monthly downloads](https://img.shields.io/npm/dm/@codingame/monaco-languageclient-react)](https://www.npmjs.com/package/@codingame/monaco-languageclient-react) [![npm version](https://img.shields.io/npm/v/@codingame/monaco-languageclient-react.svg?style=flat)](https://www.npmjs.com/package/@codingame/monaco-languageclient-react) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/codingame/monaco-languageclient-react/pulls)

### Installation

```bash
npm install @codingame/monaco-languageclient-react 
```

### Usage

#### Simple usage

You need to create an `infrastructure` object and render the `LanguageClient` component:

```tsx
import React from "react";

import LanguageClient, { Infrastructure } from "@codingame/monaco-languageclient-react";

class MyInfrastructure implements Infrastructure {
  automaticTextDocumentUpdate = false
  rootUri = 'file://...'
  useMutualizedProxy() { return false }
  getFileContent(resource, languageClient) { return ... }
  openConnection(id) {
    // create connection
  }
}
const infrastructure = new MyInfrastructure()

function LanguageClientContainer() {
  return (
   <LanguageClient
     id='java'
     infrastructure={infrastructure}
   />
  );
}
```
