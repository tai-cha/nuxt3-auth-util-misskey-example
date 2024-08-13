import type { UserDetailed as MiUser } from 'misskey-js/entities.js'

declare module '#auth-utils' {
  interface User {
    misskey?: Partial<MiUser>,
  }

  interface UserSession {
    // Add your own fields
    loggedInAt: number,
    tokens: any[],
  }
}

export {}