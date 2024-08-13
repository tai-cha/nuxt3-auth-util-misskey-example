import { defineNuxtModule, addServerImportsDir, createResolver } from '@nuxt/kit';
import defu from 'defu';

export interface moduleOptions {}

export default defineNuxtModule<moduleOptions>({
  meta: {
    name: 'auth-utils-misskey',
    configkey: 'auth-misskey',
  },
  defaults: {},
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    addServerImportsDir(resolver.resolve('./runtime/server/lib/oauth'));

    const runtimeConfig = nuxt.options.runtimeConfig;

    // define Misskey OAuth config
    runtimeConfig.oauth.misskey = defu(runtimeConfig.oauth.misskey, {
      clientId: '',
      scope: [] as string[],
    })
  },
});