<script setup lang="ts">
import { onMessage, sendMessage } from 'webext-bridge'
import VueMultiselect from 'vue-multiselect'
import { allFilenamesCached, apiKey, selectedFileCached, selectedLineNumberCached } from '~/logic/storage'
import { obsidianRequest, readDirectory, readFromFile, writeFile } from '~/utils'
import { NULL_FILENAME, NULL_LINENUMBER } from '~/constants'
import TextAreaResize from '~/components/TextAreaResize.vue'

const NULL_URL = ''

// State
const isFileRead = ref(false)
const existingNoteLines = ref<string[]>([])
const textboxContent = ref('')
const textboxLineNumber = ref<number>(selectedLineNumberCached.value)
console.log(selectedLineNumberCached.value)
const fileSelectorSelectedFile = ref(selectedFileCached.value)
if (selectedFileCached.value !== NULL_FILENAME) {
  console.log(selectedFileCached.value, NULL_FILENAME)
  updateExistingNoteLines(selectedFileCached.value)
}
// const fileSelectorOptions = ref(allFilenamesCached.value)
const textHighlightUrl = ref(NULL_URL)
const fileSelectorOptions = ref(allFilenamesCached.value)

// Custom directives
const vFocus = {
  mounted: (el) => {
    el.focus()
  },
}

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

async function readFromFileTest() {
  readFromFile('Web-capture.md').then(res => res.text()).then(res => console.log(res))
}

async function writeToFile() {
  if (textHighlightUrl === NULL_URL) {
    console.error('Error: Could not get highlight URL.')
    updateHighlight()
    return
  }
  console.log(fileSelectorSelectedFile.value)
  const newNoteLines = existingNoteLines.value.slice()
  const tabsInHeader = textboxLineNumber.value !== -1 ? newNoteLines[textboxLineNumber.value].split('\t').length - 1 : 0
  const tabsToAdd = '\t'.repeat(tabsInHeader)
  const textboxContentWithHeaderIndentation = `${tabsToAdd}${textboxContent.value}`
  const addedLine = `${textboxContentWithHeaderIndentation} ${getMarkdownLink(textHighlightUrl.value)}`
  newNoteLines.splice(textboxLineNumber.value + 1, 0, addedLine)
  // writeFile("Web-capture.md", "test text 2")
  await writeFile('Web-capture.md', newNoteLines.join('\n'))
  await updateTextboxLineNumberCached(true)
}

function getMarkdownLink(url: string) {
  return `[1](${url})`
}

async function updateExistingNoteLines(filename: string) {
  readFromFile(filename).then(res => res.text()).then((text) => {
    const textLines = text.split('\n')
    console.log('text lines are ', textLines)
    existingNoteLines.value = textLines
    isFileRead.value = true
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

async function loadFileSelector() {
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
  await sendMessage('sync-previous-filename', { filename }, { context: 'background', tabId })
  await sendMessage('sync-previous-line-number', { lineNumber: NULL_LINENUMBER }, { context: 'background', tabId })
  await updateExistingNoteLines(filename)
}

async function handleTextboxMove() {
  console.log('textbox moved')
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

loadFileSelector()
updateHighlight()
</script>

<template>
  <main class="w-[800px] px-4 py-5 text-center text-gray-700">
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
        <div>---</div>
        <pre style="display:flex;"><portal-target :name="NULL_LINENUMBER.toString()" @change="handleTextboxMove" /></pre>
      </div>

      <!-- Existing note lines -->
      <div v-for="(noteLine, index) in existingNoteLines" :key="index" class="noteLine" @click="moveTextbox(index)">
        <pre>{{ noteLine }}</pre>

        <!-- Textbox portal -->
        <div v-if="textboxLineNumber === index">
          <pre style="display:flex;"><span v-for="(_, tabIndex) in noteLine.split('\t').slice(0, -1)" :key="tabIndex">&#9;</span><portal-target :name="index.toString()" @change="handleTextboxMove" /></pre>
        </div>
      </div>
    </div>

    <button class="btn mt-2" @click="readFromFileTest">
      Read from file
    </button>
    <button class="btn mt-2" @click="writeToFile">
      Write to file
    </button>
    <button class="btn mt-2" @click="openOptionsPage">
      Open Options
    </button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ apiKey }}
    </div>
  </main>
</template>

<style>
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
  border-style: double;
  margin-bottom: 3px;
}
</style>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
