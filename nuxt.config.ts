// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ["nuxt-auth-utils"],
  runtimeConfig: {
    oauth: {
      misskey: {
        clientId: process.env.NUXT_OAUTH_MISSKEY_CLIENT_ID,
      }
    }
  },
  alias: {
    '*': "types/*"
  },
})