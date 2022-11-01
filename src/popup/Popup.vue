<script setup lang="ts">
import { onMessage, sendMessage } from 'webext-bridge'
import VueMultiselect from 'vue-multiselect'
import { browserAction, commands } from 'webextension-polyfill'
import { allFilenamesCached, apiKey, selectedFileCached, selectedLineNumberCached } from '~/logic/storage'
import { obsidianRequest, readDirectory, readFromFile, writeFile } from '~/utils'
import { NULL_FILENAME, NULL_LINENUMBER } from '~/constants'
import ohm from "ohm-js"; ohm

const linksGrammar = `
Links {
	Start = Recurse
    Recurse = (MainLink | MainBacklink | text)*
    MainLink = (~exclude text)* link Recurse
    MainBacklink =  (~exclude text)* backlink Recurse
    exclude = space | link | backlink
   	text = ~exclude any
    link = "[" (~"]" text)* "]" "(" (~")" text)* ")"
    backlink = "[[" (~"]]" text)* "]]"
}
`

function parse(text: string) {
  const grammar = ohm.grammar(linksGrammar)
  const match = grammar.match(text)
  if (match.succeeded()) {
    console.log('match succeeded')
  } else {
    console.log('match failed')
  }
}

const NULL_URL = ''
const TOPMOST_LINE_CONTENT = ' '

// State variables.
const isFileRead = ref(false)
const existingNoteLines = ref<string[]>([])
const textboxContent = ref('')
const textboxLineNumber = ref<number>(selectedLineNumberCached.value)
const fileSelectorSelectedFile = ref(selectedFileCached.value)
if (selectedFileCached.value !== NULL_FILENAME) {
  loadExistingNoteLines(selectedFileCached.value)
}
const textHighlightUrl = ref(NULL_URL)
const fileSelectorOptions = ref(allFilenamesCached.value)
const indentBalance = ref(0)

// Custom directives.
const vFocus = {
  mounted: (el) => {
    el.focus()
    // Adjusts textbox size after loading.
    adjustTextboxSize()
  },
}

// Hotkey-handling.
commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'Indent New Text': {
      indentBalance.value = indentBalance.value + 1
      break
    }
    case 'Unindent New Text': {
      const currentExistingNoteLineTabCount = convertNoteLineToTabCount(getExistingNoteLine(textboxLineNumber.value), false)
      let newIndentBalance = indentBalance.value - 1
      // Don't allow the user to unindent past the existing note line.
      if (currentExistingNoteLineTabCount + indentBalance.value < 0) {
        newIndentBalance = -currentExistingNoteLineTabCount
      }
      indentBalance.value = newIndentBalance
      break
    }
  }
})

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

function getExistingNoteLine(lineNumber: number) {
  return lineNumber !== NULL_LINENUMBER
    ? existingNoteLines.value[lineNumber]
    : ' '
}

async function writeToFile() {
  // Guards.
  if (textHighlightUrl.value === NULL_URL) {
    console.error('Error: Could not get highlight URL.')
    window.alert('Error: Could not get highlight URL.')
    await updateHighlight()
    return
  }
  if (fileSelectorSelectedFile.value === NULL_FILENAME) {
    console.error('Error: Could not get selected file.')
    window.alert('Error: Could not get selected file.')
    return
  }

  // Transform text.
  const newNoteLines = existingNoteLines.value.slice()
  const tabsInHeader = convertNoteLineToTabCount(getExistingNoteLine(textboxLineNumber.value), true)
  const tabsToAdd = '\t'.repeat(tabsInHeader)
  const textboxContentWithHeaderIndentation = `${tabsToAdd}${textboxContent.value}`
  const addedLine = `${textboxContentWithHeaderIndentation} ${getMarkdownLink(textHighlightUrl.value)}`
  newNoteLines.splice(textboxLineNumber.value + 1, 0, addedLine)

  await writeFile(fileSelectorSelectedFile.value, newNoteLines.join('\n'))

  // Keep settings.
  await updateTextboxLineNumberCached(true)
}

function getMarkdownLink(url: string) {
  return `[1](${url})`
}

async function loadExistingNoteLines(filename: string) {
  readFromFile(filename).then(res => res.text()).then((text) => {
    const textLines = text.split('\n')
    console.log('text lines are ', textLines)
    existingNoteLines.value = textLines
    isFileRead.value = true
    // textLines.forEach((line) => {
    //   parse(line)
    // })
  })
}

function moveTextbox(index: number) {
  textboxLineNumber.value = index
}

async function updateHighlight() {
  onMessage('highlight-to-textbox', async ({ data }) => {
    if (data.url === null) {
      const err = 'Error: Could not generate URL to selected highlight. Report this & try a different highlight.'
      console.error(err)
      window.alert(err)
      window.close()
    }
    textHighlightUrl.value = data.url!
    textboxContent.value = data.text
  })
  const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
  sendMessage('highlight-input', { tabId }, { context: 'content-script', tabId })
}

async function loadFileSelectorOptions() {
  // TODO cache this by doing every time the plugin loads, or by clicking refresh
  readDirectory()
    .then(res => res.json())
    .then((res) => {
      fileSelectorOptions.value = res.files
    })
}

async function handleFileSelectorSelect(filename: string) {
  console.log('updated filename is ', filename)
  const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
  // Sync with background script.
  fileSelectorSelectedFile.value = filename
  await sendMessage('sync-previous-filename', { filename }, { context: 'background', tabId })
  await sendMessage('sync-previous-line-number', { lineNumber: NULL_LINENUMBER }, { context: 'background', tabId })
  await loadExistingNoteLines(filename)
}

async function handleTextboxMove() {
  let newHeader = getExistingNoteLine(textboxLineNumber.value)
  // Match textbox bullet point.
  while (newHeader.startsWith('\t')) {
    newHeader = newHeader.slice(1)
  }
  if (newHeader.startsWith('- ') && !textboxContent.value.startsWith('- ')) {
    textboxContent.value = `- ${textboxContent.value}`
  }
  else if (!newHeader.startsWith('- ') && textboxContent.value.startsWith('- ')) {
    textboxContent.value = textboxContent.value.slice(2)
  }
  await updateTextboxLineNumberCached(false)
}

async function updateTextboxLineNumberCached(isWriting: boolean) {
  const lineNumber = textboxLineNumber.value + (isWriting ? 1 : 0)
  const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
  await sendMessage('sync-previous-line-number', { lineNumber }, { context: 'background', tabId })
}

const textbox = ref(null)

function adjustTextboxSize() {
  const element = textbox.value
  if (!element)
    return
  element!.style.height = `${element.scrollHeight}px`
}

// Turn a string of text into a `\t` count with adjustments by user.
function convertNoteLineToTabCount(noteLine: string, useUserAdjustments: boolean) {
  const tabs = noteLine.split('\t')
  return Math.max(0, tabs.length - 1 + (useUserAdjustments ? indentBalance.value : 0))
}

loadFileSelectorOptions()
updateHighlight()
</script>

<template>
  <main class="w-[800px] px-4 py-5 text-center text-gray-1400 border-solid border-4 border-gray-100">
    <Logo />

    <VueMultiselect
      v-model="fileSelectorSelectedFile"
      :options="fileSelectorOptions"
      :close-on-select="true"
      placeholder="Select one"
      :allow-empty="false"
      deselect-label="selected"
      @select="handleFileSelectorSelect($event)"
    />

    <portal :to="textboxLineNumber.toString()">
      <textarea
        id="textbox"
        ref="textbox"
        v-model="textboxContent"
        v-focus
        :rows="2"
        :cols="4"
        @input="adjustTextboxSize"
      />
    </portal>

    <div v-if="isFileRead" class="note">
      <!-- Starter line -->
      <div class="noteLine" @click="moveTextbox(NULL_LINENUMBER)">
        <pre>{{ TOPMOST_LINE_CONTENT }}</pre>
        <pre style="display:flex;"><template v-if="textboxLineNumber === NULL_LINENUMBER"><span v-for="tabIndex in convertNoteLineToTabCount(TOPMOST_LINE_CONTENT, true)" :key="tabIndex">&#9;</span></template><portal-target :name="NULL_LINENUMBER.toString()" @change="handleTextboxMove" /></pre>
      </div>

      <!-- Existing note lines -->
      <div v-for="(noteLine, index) in existingNoteLines" :key="index" class="noteLine" @click="moveTextbox(index)">
        <pre>{{ noteLine }}</pre>

        <!-- Textbox portal -->
        <div v-if="textboxLineNumber === index">
          <pre style="display:flex;"><span v-for="tabIndex in convertNoteLineToTabCount(noteLine, true)" :key="tabIndex">&#9;</span><portal-target :name="index.toString()" @change="handleTextboxMove" /></pre>
        </div>
      </div>
    </div>

    <div class="footer">
      <button class="btn mt-2" @click="adjustTextboxSize">
        Read from file
      </button>
      <button class="btn mt-2" @click="writeToFile">
        Write to file
      </button>
      <button class="btn mt-2" @click="openOptionsPage">
        Open Options
      </button>
    </div>
  </main>
</template>

<style>
main {
  height: 600px; /* Note: The max height of extensions. */
}
.footer {
  left: 200px; /* Note: Half the max width of extensions */
  display: flex;
  position: fixed;
  bottom: 0px;
}
.note {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: blue;
}
.noteLine {
  text-align: left;
  cursor: pointer;
  background: white;
  width: 100%;
}
.noteLine pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
.noteLine:hover {
  background: lightgrey;
}
#textbox {
  justify-content: left;
  align-items: flex-start;
  flex: 2;
  resize: none;
  background: bisque;
  border-radius: 2px;
  margin-bottom: 3px;
}
</style>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
