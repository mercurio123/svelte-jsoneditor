<script lang="ts">
  import {
    createAjvValidator,
    EditableValue,
    javascriptQueryLanguage,
    jmespathQueryLanguage,
    JSONEditor,
    lodashQueryLanguage,
    ReadonlyValue,
    renderValue
  } from 'svelte-jsoneditor'
  import { useLocalStorage } from '../../lib/utils/localStorageUtils.js'
  import { range } from 'lodash-es'
  import { tick } from 'svelte'
  import { parse, stringify } from 'lossless-json'
  import { truncate } from '$lib/utils/stringUtils.js'
  import { parseJSONPath, stringifyJSONPath } from '$lib/utils/pathUtils'
  import { compileJSONPointer, parseJSONPointer } from 'immutable-json-patch'

  // const LosslessJSON: JSONParser = { ... } // FIXME: make the types work
  const LosslessJSON = {
    parse,
    stringify
  }

  let content = {
    text: `{
  "boolean": true,
  "color": "#82b92c",
  "html_code": "&quot;",
  "html_characters<a>": "<a>",
  "escaped_unicode": "\\u260e",
  "long": 9223372036854775807,
  "float": 4.0,
  "big": 1e500,
  "unicode": "😀,💩",
  "escaped double quote": "\\"abc\\"",
  "unicode double quote": "\\u0022abc\\u0022",
  "return": "\\n",
  "null": null,
  "number": 123,
  "object": {
    "a": "b",
    "c": "d"
  },
  "string": "Greeting!",
  "stringContainingNumber": "1234",
  "multi\\nline    text": "Hello\\nWorld    text",
  "tab": "Hello\\tTab",
  "backslash": "back\\\\slash",
  "forwardslash": "forward\\/slash",
  "quote": "quote\\"",
  "timestamp": 1534952749890,
  "url": "https://jsoneditoronline.org",
  "array": [
    1,
    2,
    [
      3,
      4,
      5
    ],
    4,
    5,
    6,
    7,
    8,
    9,
    10
  ],
  "xss?": "<button onclick=alert('oopsie!!!')>test xss</button>",
  "xss array": [
    {
      "<button onclick=alert('oopsie!!!')>test xss</button>": "xss?"
    }
  ],
  "long line": "longwordlongword longword2longword2longword2 longlinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelonglinelongline"
}`,
    json: undefined
  }

  const schema = {
    title: 'Employee',
    description: 'Object containing employee details',
    type: 'object',
    properties: {
      boolean: {
        title: 'A boolean',
        type: 'boolean'
      },
      array: {
        type: 'array',
        items: {
          type: 'number',
          minimum: 10
        }
      }
    },
    required: ['foo']
  }

  const arraySchema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'number'
        },
        random: {
          type: 'number',
          minimum: 0
        },
        array: {
          type: 'array',
          items: {
            type: 'number'
          }
        },
        name: {
          type: 'string'
        },
        long: {
          type: 'number'
        },
        'nested object': {
          type: 'object'
        }
      },
      required: ['id', 'name', 'random', 'array'],
      additionalProperties: false
    },
    minItems: 1001
  }

  const themes = [
    { value: 'jse-theme-default', label: 'default' },
    { value: 'jse-theme-dark', label: 'dark' },
    { value: 'jse-theme-big', label: 'big' }
  ]

  const indentations = [
    { value: 2, label: '2 spaces' },
    { value: 3, label: '3 spaces' },
    { value: '    ', label: '4 spaces' }, // equivalent to value: 4
    { value: 6, label: '6 spaces' },
    { value: 8, label: '8 spaces' },
    { value: '\t', label: '1 tab' }
  ]

  const parsers = [
    {
      id: 'JSON',
      value: JSON,
      label: 'JSON'
    },
    {
      id: 'LosslessJSON',
      value: LosslessJSON,
      label: 'LosslessJSON'
    }
  ]

  const pathParsers = [
    {
      id: 'JSONPath',
      value: {
        parse: parseJSONPath,
        stringify: stringifyJSONPath
      },
      label: 'JSONPath'
    },
    {
      id: 'JSONPointer',
      value: {
        parse: parseJSONPointer,
        stringify: compileJSONPointer
      },
      label: 'JSONPointer'
    }
  ]

  const validator = createAjvValidator({ schema })
  const arrayValidator = createAjvValidator({ schema: arraySchema })

  let refTreeEditor
  let refTextEditor

  // for debugging
  $: if (typeof window !== 'undefined') {
    window['refTreeEditor'] = refTreeEditor
  }
  $: if (typeof window !== 'undefined') {
    window['refTextEditor'] = refTextEditor
  }

  const showTreeEditor = useLocalStorage('svelte-jsoneditor-demo-showTreeEditor', true)
  const showTextEditor = useLocalStorage('svelte-jsoneditor-demo-showTextEditor', true)
  const showRawContents = useLocalStorage('svelte-jsoneditor-demo-showRawContents', false)
  let height = '440px'
  const validate = useLocalStorage('svelte-jsoneditor-demo-validate', false)
  const validateArray = useLocalStorage('svelte-jsoneditor-demo-validate-array', false)
  const readOnly = useLocalStorage('svelte-jsoneditor-demo-readOnly', false)
  const mainMenuBar = useLocalStorage('svelte-jsoneditor-demo-mainMenuBar', true)
  const navigationBar = useLocalStorage('svelte-jsoneditor-demo-navigationBar', true)
  const statusBar = useLocalStorage('svelte-jsoneditor-demo-statusBar', true)
  const escapeControlCharacters = useLocalStorage(
    'svelte-jsoneditor-demo-escapeControlCharacters',
    false
  )
  const escapeUnicodeCharacters = useLocalStorage(
    'svelte-jsoneditor-demo-escapeUnicodeCharacters',
    false
  )
  const flattenColumns = useLocalStorage('svelte-jsoneditor-demo-flattenColumns', false)
  const useCustomValueRenderer = useLocalStorage(
    'svelte-jsoneditor-demo-useCustomValueRenderer',
    false
  )
  const multipleQueryLanguages = useLocalStorage(
    'svelte-jsoneditor-demo-multipleQueryLanguages',
    true
  )
  const selectedTheme = useLocalStorage('svelte-jsoneditor-demo-theme', themes[0].value)
  const selectedIndentation = useLocalStorage(
    'svelte-jsoneditor-demo-indentation',
    indentations[0].value
  )
  const selectedParserId = useLocalStorage('svelte-jsoneditor-demo-parser', parsers[1].id)
  const selectedPathParserId = useLocalStorage(
    'svelte-jsoneditor-demo-path-parser',
    pathParsers[0].id
  )
  const tabSize = useLocalStorage('svelte-jsoneditor-demo-tabSize', indentations[0].value)
  let leftEditorMode = 'tree'

  $: queryLanguages = $multipleQueryLanguages
    ? [javascriptQueryLanguage, lodashQueryLanguage, jmespathQueryLanguage]
    : [javascriptQueryLanguage]
  let queryLanguageId = javascriptQueryLanguage.id // TODO: store in local storage

  $: selectedParser = parsers.find((parser) => parser.id === $selectedParserId).value
  $: selectedPathParser = pathParsers.find((parser) => parser.id === $selectedPathParserId).value

  $: selectedValidator = $validate ? validator : $validateArray ? arrayValidator : undefined

  // only editable/readonly div, no color picker, boolean toggle, timestamp
  function customRenderValue({
    path,
    value,
    readOnly,
    enforceString,
    searchResultItems,
    isEditing,
    normalization,
    onPatch,
    onPasteJson,
    onSelect,
    onFind,
    focus
  }) {
    const renderers = []

    if (isEditing) {
      renderers.push({
        component: EditableValue,
        props: {
          path,
          value,
          enforceString,
          normalization,
          onPatch,
          onPasteJson,
          onSelect,
          onFind,
          focus
        }
      })
    }

    if (!isEditing) {
      renderers.push({
        component: ReadonlyValue,
        props: { path, value, readOnly, normalization, searchResultItems, onSelect }
      })
    }

    return renderers
  }

  function onRenderMenu(mode, items) {
    if (!import.meta.env.SSR) {
      console.log('onRenderMenu', mode, items)
    }
  }

  function onChangeTree(content, previousContent, { contentErrors, patchResult }) {
    console.log('onChangeTree', {
      content,
      previousContent,
      contentErrors,
      patchResult
    })
  }

  function onChangeText(content, previousContent, { contentErrors, patchResult }) {
    console.log('onChangeText', {
      content,
      previousContent,
      contentErrors,
      patchResult
    })
  }

  function onChangeMode(mode) {
    console.log('onChangeMode', mode)
  }

  function onChangeQueryLanguage(newQueryLanguageId) {
    console.log('onChangeQueryLanguage', newQueryLanguageId)
    queryLanguageId = newQueryLanguageId
  }

  function openInWindow() {
    const popupWindow = window.open(
      '',
      '_blank',
      `location=no,toolbar=no,menubar=no,status=no,directories=no,width=${500},height=${600},left=${0},top=${0},editorWind=yes`
    )
    window['popupEditor'] = new JSONEditor({
      target: popupWindow.document.body,
      props: {}
    })
  }
</script>

<svelte:head>
  <title>development application | svelte-jsoneditor</title>
</svelte:head>

<div class="demo-app {$selectedTheme}">
  <h1>svelte-jsoneditor development application</h1>
  <p>
    <label>
      Indentation: <select bind:value={$selectedIndentation}>
        {#each indentations as indentation}
          <option value={indentation.value}>{indentation.label}</option>
        {/each}
      </select>
    </label>
    <label>
      tabSize: <input type="number" bind:value={$tabSize} />
    </label>
    <label>
      Height: <input type="text" bind:value={height} />
    </label>
    <label>
      Theme: <select bind:value={$selectedTheme}>
        {#each themes as theme}
          <option value={theme.value}>{theme.label}</option>
        {/each}
      </select>
    </label>
  </p>
  <p>
    <label>
      <input type="checkbox" bind:checked={$validate} /> validate
    </label>
    <label>
      <input type="checkbox" bind:checked={$validateArray} /> validate array
    </label>
    <label>
      <input type="checkbox" bind:checked={$mainMenuBar} /> mainMenuBar
    </label>
    <label>
      <input type="checkbox" bind:checked={$navigationBar} /> navigationBar
    </label>
    <label>
      <input type="checkbox" bind:checked={$statusBar} /> statusBar
    </label>
    <label>
      <input type="checkbox" bind:checked={$escapeControlCharacters} /> escapeControlCharacters
    </label>
    <label>
      <input type="checkbox" bind:checked={$escapeUnicodeCharacters} /> escapeUnicodeCharacters
    </label>
    <label>
      <input type="checkbox" bind:checked={$flattenColumns} /> flattenColumns
    </label>
    <label>
      <input type="checkbox" bind:checked={$readOnly} /> readOnly
    </label>
    <label>
      <input type="checkbox" bind:checked={$useCustomValueRenderer} /> Custom onRenderValue
    </label>
  </p>
  <p>
    <label>
      <input type="checkbox" bind:checked={$multipleQueryLanguages} /> Multiple query languages
    </label>
    {#if $multipleQueryLanguages}
      . Selected query language:
      <select bind:value={queryLanguageId}>
        {#each queryLanguages as queryLanguage}
          <option value={queryLanguage.id}>{queryLanguage.name}</option>
        {/each}
      </select>
    {/if}
  </p>

  <p>
    JSON Parser: <select bind:value={$selectedParserId}>
      {#each parsers as parser}
        <option value={parser.id}>{parser.label}</option>
      {/each}
    </select>

    Path Parser:
    <select bind:value={$selectedPathParserId}>
      {#each pathParsers as pathParser}
        <option value={pathParser.id}>{pathParser.label}</option>
      {/each}
    </select>
  </p>

  <p class="buttons">
    <button
      on:click={() => {
        content = {
          text: undefined,
          json: [1, 2, 3, 4, 5]
        }
      }}
    >
      Update json
    </button>
    <button
      on:click={() => {
        content = {
          text: '[1, 2, 3, 4]',
          json: undefined
        }
      }}
    >
      Update text
    </button>
    <button
      on:click={() => {
        content = {
          text: '',
          json: undefined
        }
      }}
    >
      Set empty text
    </button>
    <button
      on:click={() => {
        content = {
          text: undefined,
          json: ''
        }
      }}
    >
      Set empty string
    </button>
    <button
      on:click={() => {
        content = {
          text: undefined,
          json: range(0, 999)
        }
      }}
    >
      Set long array
    </button>
    <button
      on:click={() => {
        content = {
          text: undefined,
          json: [...new Array(1000)].map((value, index) => {
            const random = Math.round(Math.random() * 1000)
            const item = {
              id: index,
              name: 'Item ' + index,
              random,
              'nested object': {
                value: random
              },
              array: [index, 1, 7, 3],
              long: 9223372000000000000n + BigInt(random)
            }

            // introduce some validation issues
            if (index === 3) {
              item.array[2] = 'oopsie'
              item.array[3] = null
              delete item['id']
            }
            if (index === 4) {
              item.random = -1
            }
            if (index === 7 || index === 802) {
              item.random = String(item.random)
              item.long = String(item.long)
            }
            if (index === 9) {
              item.unknownProp = 'other'
            }

            return item
          })
        }
      }}
    >
      Set long array with objects
    </button>
    <button
      on:click={() => {
        content = {
          text: 'abc',
          json: undefined
        }
      }}
    >
      Set repairable text
    </button>
    <button
      on:click={() => {
        content = {
          text: '[1, 2, 3 }',
          json: undefined
        }
      }}
    >
      Set unrepairable text
    </button>
  </p>
  <p class="buttons">
    <button
      on:click={() => {
        refTreeEditor.patch([{ op: 'add', path: '/updated', value: '2022-09-01T10:13:44Z' }])
      }}
    >
      Patch json in tree editor
    </button>
    <button
      on:click={() => {
        const content = refTreeEditor.get()
        const updatedContent = {
          json: { ...content.json, updated: '2022-09-01T10:13:44Z' }
        }
        refTreeEditor.set(updatedContent)
      }}
    >
      Update json in tree editor
    </button>
    <button on:click={openInWindow}>Open editor in new window</button>
    <input
      type="file"
      on:change={(event) => {
        console.log('loadFile', event.target.files)
        console.time('load file')

        const reader = new window.FileReader()
        const file = event.target.files[0]
        reader.onload = function (event) {
          console.timeEnd('load file')

          console.time('parse and render')

          content = {
            text: event.target.result,
            json: undefined
          }

          tick().then(() => console.timeEnd('parse and render'))
        }
        reader.readAsText(file)
      }}
    />
  </p>

  <p>
    <label>
      <input type="checkbox" bind:checked={$showRawContents} /> Show raw contents (at the bottom)
    </label>
  </p>

  <div class="columns">
    <div class="left">
      <p>
        <label>
          <input type="checkbox" bind:checked={$showTreeEditor} /> Show tree editor
        </label>
        <select class="mode-toggle" bind:value={leftEditorMode}>
          <option value="tree">tree</option>
          <option value="text">text</option>
          <option value="table">table</option>
          <option value="code">code (deprecated)</option>
        </select>
      </p>
      <div class="tree-editor" style="height: {height}">
        {#if $showTreeEditor}
          <JSONEditor
            bind:this={refTreeEditor}
            bind:content
            bind:mode={leftEditorMode}
            mainMenuBar={$mainMenuBar}
            navigationBar={$navigationBar}
            statusBar={$statusBar}
            escapeControlCharacters={$escapeControlCharacters}
            escapeUnicodeCharacters={$escapeUnicodeCharacters}
            flattenColumns={$flattenColumns}
            readOnly={$readOnly}
            indentation={$selectedIndentation}
            tabSize={$tabSize}
            parser={selectedParser}
            pathParser={selectedPathParser}
            validator={selectedValidator}
            {queryLanguages}
            bind:queryLanguageId
            {onRenderMenu}
            onChange={onChangeTree}
            onRenderValue={$useCustomValueRenderer ? customRenderValue : renderValue}
            {onChangeMode}
          />
        {/if}
      </div>

      {#if $showRawContents}
        <div class="data">
          json contents:
          <pre>
					<code>
					{content.json !== undefined
                ? truncate(selectedParser.stringify(content.json, null, 2), 1e5)
                : 'undefined'}
					</code>
				</pre>
        </div>
      {/if}
    </div>
    <div class="right">
      <p>
        <label>
          <input type="checkbox" bind:checked={$showTextEditor} /> Show text editor
        </label>
      </p>

      <div class="text-editor" style="height: {height}">
        {#if $showTextEditor}
          <JSONEditor
            bind:this={refTextEditor}
            mode="text"
            bind:content
            mainMenuBar={$mainMenuBar}
            navigationBar={$navigationBar}
            statusBar={$statusBar}
            escapeControlCharacters={$escapeControlCharacters}
            escapeUnicodeCharacters={$escapeUnicodeCharacters}
            flattenColumns={$flattenColumns}
            readOnly={$readOnly}
            indentation={$selectedIndentation}
            tabSize={$tabSize}
            parser={selectedParser}
            pathParser={selectedPathParser}
            validator={selectedValidator}
            {queryLanguages}
            {queryLanguageId}
            {onChangeQueryLanguage}
            {onRenderMenu}
            onChange={onChangeText}
            onRenderValue={$useCustomValueRenderer ? customRenderValue : renderValue}
            {onChangeMode}
          />
        {/if}
      </div>

      {#if $showRawContents}
        <div class="data">
          text contents:
          <pre>
						<code>
						{truncate(content.text, 1e5)}
						</code>
					</pre>
        </div>
      {/if}
    </div>
  </div>
</div>

<!--
Workaround for the console warning:

 <Development> received an unexpected slot "default".

See https://github.com/sveltejs/kit/issues/981
-->
{#if false}
  <slot />
{/if}

<style lang="scss">
  @import '../../lib/themes/jse-theme-dark.css';
  @import '../themes/jse-theme-big.css';

  .demo-app {
    margin: -10px; // compensate for the padding of the root element
    padding: 10px;
    height: 100%;
    overflow: auto;

    &.jse-theme-dark {
      background: #4d4d4d;
      color: #fff;
    }

    &.jse-theme-big {
      background: #ffe2d8;
    }
  }

  .columns {
    display: flex;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
  }

  .columns .left,
  .columns .right {
    flex: 1;
    min-width: 0;
  }

  .tree-editor,
  .text-editor {
    // some styling to try out if it doesn't break the styling of the editor
    line-height: 72px;
    font-size: 72px;
    font-family: 'Comic Sans MS', 'Courier New', serif;
  }

  .mode-toggle {
    font-size: 12pt;
    font-family: arial, serif;
  }

  .data {
    margin-top: 10px;
  }

  pre {
    background: #f5f5f5;
  }

  p {
    max-width: none;
    margin: 10px 0;

    &.buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
  }

  button,
  input,
  select {
    font-size: inherit;
    font-family: inherit;
  }

  label {
    white-space: nowrap;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }

  :global(.jse-main.jse-focus) {
    box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.24);
  }
</style>
