<script setup lang="ts">
const { loggedIn } = useUserSession();

onMounted(() => {
  if (loggedIn.value) {
    window.location.href = '/';
  }
})
</script>

<template>
  <div>
    <form action="/api/auth/misskey" method="GET">
      <input id="issuer" name="issuer" placeholder="https://misskey.io" />
      <button type="submit" >
        Misskeyでログイン
      </button>
    </form>
  </div>
</template>