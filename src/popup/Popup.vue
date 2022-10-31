<script setup lang="ts">
import { onMessage, sendMessage } from 'webext-bridge'
import VueMultiselect from 'vue-multiselect'
import { allFilenamesCached, apiKey, selectedFileCached, selectedLineNumberCached } from '~/logic/storage'
import { obsidianRequest, readDirectory, readFromFile, writeFile } from '~/utils'
import { NULL_FILENAME, NULL_LINENUMBER } from "~/constants";

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
  console.log(fileSelectorSelectedFile.value)
  const newNoteLines = existingNoteLines.value.slice()
  newNoteLines.splice(textboxLineNumber.value + 1, 0, textboxContent.value)
  // writeFile("Web-capture.md", "test text 2")
  await writeFile('Web-capture.md', newNoteLines.join('\n'))
  await updateTextboxLineNumberCached(true)
}

async function updateExistingNoteLines(filename: string) {
  readFromFile(filename).then(res => res.text()).then((text) => {
    const textLines = text.split('\n')
    existingNoteLines.value = textLines
    isFileRead.value = true
  })
}

function moveTextbox(index: number) {
  textboxLineNumber.value = index
}

async function getHighlight() {
  onMessage('highlight-to-textbox', async ({ data }) => {
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

loadFileSelector()
getHighlight()
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
      <input v-model="textboxContent" v-focus>
    </portal>

    <!-- Starter line -->
    <div class="noteLine" @click="moveTextbox(NULL_LINENUMBER)">
      <div>---</div>
      <portal-target :name="NULL_LINENUMBER.toString()" />
    </div>

    <!-- Existing note lines -->
    <div v-if="isFileRead" class="note">
      <div v-for="(noteLine, index) in existingNoteLines" :key="index" class="noteLine" @click="moveTextbox(index)">
        <div>{{ noteLine }}</div>
        <portal-target :name="index.toString()" @change="handleTextboxMove"/>
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
.noteLine {
  cursor: pointer;
}
</style>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
