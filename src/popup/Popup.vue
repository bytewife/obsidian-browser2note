<script setup lang="ts">
import TextInput from './TextInput.vue'
import { DefaultLocalSettings } from '~/constants'
import { apiKey } from '~/logic/storage'
import { obsidianRequest, readFromFile, writeFile } from '~/utils'
import type { StatusResponse } from '~/types'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

async function readFromFileTest() {
  readFromFile("Web-capture.md").then(res => res.text()).then(res => console.log(res))
}

async function writeToFile() {
  writeFile("Web-capture.md", "test text 2")
}

// How to get API key from vue?
console.log(`api key is ${apiKey.value}`)
// async function test() {
//   let result: Response
//   try {
//     // TODO: Get secure mode working.
//     result = await obsidianRequest(
//       apiKey.value,
//       '/vault/',
//       { method: 'get' },
//       true,
//     )
//   }
//   catch (e) {
//     // eslint-disable-next-line no-console
//     console.log(
//         `Unable to connect to Obsidian: ${
//             (e as Error).message
//         }. Obsidian Local REST API is probably running in secure-only mode, and your browser probably does not trust its certificate.  Either enable insecure mode from Obsidian Local REST API's settings panel, or see the settings panel for instructions regarding where to acquire the certificate you need to configure your browser to trust.`,
//     )
//     return
//   }
//
//   const body: StatusResponse = await result.json()
//   if (result.status !== 200) {
//     // eslint-disable-next-line no-console
//     console.log(
//         `Unable to connect to Obsidian: (Status Code ${result.status}) ${JSON.stringify(body)}.`)
//     return
//   }
//   // eslint-disable-next-line no-console
//   console.log(`successful body is ${JSON.stringify(body)}`)
// }

const noteLines = ref<string[]>([])
const isSpreadDone = ref(false)
async function getFileText(filename: string) {
  readFromFile(filename).then(res => res.text()).then(text => {
    const textLines = text.split('\n')
    noteLines.value = textLines
    console.log(noteLines)
    isSpreadDone.value = true
    console.log(isSpreadDone)
  })
}

const textboxContentState = ref('')
const textboxLineNumber = ref('1')

function moveTextbox(index: number, text: string) {
  console.log(text)
  textboxLineNumber.value = index.toString()
}

function logA(a) {
  console.log(a)
}

getFileText('Web-capture.md')
// test()
</script>

<template>
  <main class="w-[800px] px-4 py-5 text-center text-gray-700">
    <Logo/>

    <portal :to="textboxLineNumber">
      <input v-model="textboxContentState">
    </portal>

    <div v-if="isSpreadDone" class="note">
      <div v-for="(noteLine, index) in noteLines" :key="index" :class="`${index}`" @click="moveTextbox(index, textboxContentState)">
        <div>{{ noteLine }}</div>
        <portal-target :name="`${index}`"/>
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
