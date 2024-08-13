import { setUserSession, oauthMisskeyEventHandler } from "#imports";
import type { Endpoints as MiEndpoints } from 'misskey-js'

export default oauthMisskeyEventHandler({
  config: {
  },
  async onSuccess(event, { user, tokens } : { user: MiEndpoints['i']['res'], tokens: any[] }) {
    await setUserSession(event, {
      user: {
        misskey: {
          // add more properties you need
          id: user.id,
          name: user.name,
          username: user.username, 
          host: user.host,
          avatarUrl: user.avatarUrl,
          isBot: user.isBot,
          description: user.description,
        }
      },
      tokens,
      loggedInAt: new Date().getTime(),
    })
    return sendRedirect(event, "/login")
  },
  onError(event, error) {
    return sendRedirect(event, "/login")
  }
})