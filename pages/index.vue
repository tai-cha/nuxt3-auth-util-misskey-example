<script setup lang="ts">
const { loggedIn, user, session, fetch, clear } = useUserSession();
</script>
<template>
  <div id="appInfo" style="display: none;">
    <!-- （必須項目）hrefのアドレスが認証コードの転送先になります。 -->
    <link rel='redirect_uri' href='/api/auth/misskey'>

    <!-- ユーザーに見せるアプリの名前になります。なかったらこのページのアドレスが名前になります。 -->
    <div class='h-app'>
      <a href="/" class="u-url p-name">Test OAuth app</a>
    </div>
  </div>
  <div v-if="loggedIn">
    <h1>Logged in: {{ user?.misskey?.username }}@{{ user?.misskey?.host }}</h1>
    <pre>{{ JSON.stringify(user?.misskey, undefined, 2) }}</pre>
    <p>Logged in since: {{ new Date(session.loggedInAt).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'long', }) }}</p>
    <button @click="clear">Logout</button>
  </div>
  <div v-else>
    <h1>Not Logged in</h1>
    <NuxtLink to="/login">
      <button>ログインページへ</button>
    </NuxtLink>
  </div>
</template>