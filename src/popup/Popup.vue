<script setup lang="ts">
import { onMessage, sendMessage } from 'webext-bridge';
import { apiKey } from '~/logic/storage'
import { obsidianRequest, readFromFile, writeFile } from '~/utils'

// Custom directives
const vFocus = {
  mounted: (el) => {
    el.focus()
  }
}

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

async function readFromFileTest() {
  readFromFile("Web-capture.md").then(res => res.text()).then(res => console.log(res))
}

const existingNoteLines = ref<string[]>([])
const textboxContent = ref('')
const EMPTY_NOTE_LINE_NUMBER = -1
const textboxLineNumber = ref<number>(EMPTY_NOTE_LINE_NUMBER)

async function writeToFile() {
  const newNoteLines = existingNoteLines.value.slice()
  newNoteLines.splice(textboxLineNumber.value + 1, 0, textboxContent.value)
  // writeFile("Web-capture.md", "test text 2")
  writeFile("Web-capture.md", newNoteLines.join('\n'))
}

const isSpreadDone = ref(false)
async function getFileText(filename: string) {
  readFromFile(filename).then(res => res.text()).then(text => {
    const textLines = text.split('\n')
    existingNoteLines.value = textLines
    console.log(existingNoteLines)
    isSpreadDone.value = true
  })
}

function moveTextbox(index: number, text: string) {
  textboxLineNumber.value = index
}

getFileText('Web-capture.md')

async function getHighlight() {
  onMessage('highlight-to-textbox', async ({ data }) => {
    textboxContent.value = data.text
    console.log(textboxContent)
  })
  const tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id!
  sendMessage('highlight-input', { tabId }, { context: 'content-script', tabId })
}
getHighlight()
</script>

<template>
  <main class="w-[800px] px-4 py-5 text-center text-gray-700">
    <Logo/>

    <portal :to="textboxLineNumber.toString()">
      <input v-model="textboxContent" v-focus>
    </portal>

    <!-- Starter line -->
    <div class="noteLine" @click="moveTextbox(EMPTY_NOTE_LINE_NUMBER, textboxContent)">
      <div>---</div>
      <portal-target :name="EMPTY_NOTE_LINE_NUMBER.toString()"/>
    </div>

    <!-- Existing note lines -->
    <div v-if="isSpreadDone" class="note">
      <div v-for="(noteLine, index) in existingNoteLines" :key="index" class="noteLine" @click="moveTextbox(index, textboxContent)">
        <div>{{ noteLine }}</div>
        <portal-target :name="index.toString()"/>
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
