import type { H3Event } from 'h3'
import { eventHandler, createError, getQuery, getRequestURL, sendRedirect, setCookie, getCookie, deleteCookie } from 'h3'
import { withQuery, parseURL, stringifyParsedURL } from 'ufo'
import { defu } from 'defu'
import { useRuntimeConfig } from '#imports'
import type { OAuthConfig } from '#auth-utils'
import pkceChallenge from 'pkce-challenge'
import type { Endpoints as MiEndpoints } from 'misskey-js'

export interface OAuthMisskeyConfig {
  /**
   * Misskey OAuth Issuer
   * @default 'https://misskey.io'
   */
  issuer?: string
  /**
   * Misskey OAuth Client ID
   * This must be address of app introducing page
   * @default process.env.NUXT_OAUTH_MISSKEY_CLIENT_ID
   */
  clientId?: string
  /**
   * Misskey OAuth Scope
   * @default []
   * @see https://misskey-hub.net/ja/docs/for-developers/api/permission/
   * @example ['read:account', 'write:account', 'read:following']
   * Without the identify scope the user will not be returned.
   */
  scope?: string[]
  /**
   * Require email from user, adds the ['read:account'] scope if not present.
   * @default false
   */
  emailRequired?: boolean
  /**
   * Require profile from user, adds the ['read:account'] scope if not present.
   * @default true
   */
  profileRequired?: boolean
  /**
   * Misskey OAuth Authorization URL
   * @default `${issuer}/oauth/authorize`
   */
  authorizationURL?: string
  /**
   * Misskey OAuth Token URL
   * @default `${issuer}/oauth/token`
   */
  tokenURL?: string

  /**
   * Extra authorization parameters to provide to the authorization URL
   * @see 'https://misskey-hub.net/ja/docs/for-developers/api/token/oauth/'
   * @example { }
   */
  authorizationParams?: Record<string, string>
}

export function oauthMisskeyEventHandler({ config, onSuccess, onError }: OAuthConfig<OAuthMisskeyConfig>) {
  return eventHandler(async (event: H3Event) => {
    const { issuer, code } = getQuery(event)
    config = defu((issuer != null && issuer !== '' ? {issuer} : {}),
                  config,
                  useRuntimeConfig(event).oauth.misskey,
                  {
                    issuer: 'https://misskey.io',
                    profileRequired: true,
                    authorizationParams: {},
                  }
            ) as OAuthMisskeyConfig

    const scope = config.scope || []
    const authorizationURL = config.authorizationURL || `${config.issuer}/oauth/authorize`
    const tokenURL = config.tokenURL || `${config.issuer}/oauth/token`
    const pkce = await pkceChallenge()

    if (!config.clientId) {
      const error = createError({
        statusCode: 500,
        message: 'Missing NUXT_OAUTH_MISSKEY_CLIENT_ID env variables.',
      })
      if (!onError) throw error
      return onError(event, error)
    }

    const redirectUrlObject = getRequestURL(event)
    // remove query params
    const redirectUrl = redirectUrlObject.origin + redirectUrlObject.pathname

    if (!code) {
      if ( config.issuer == null ) {
        const error = createError({
          statusCode: 500,
          message: 'Missing issuer variables.',
        })
        if (!onError) throw error
        return onError(event, error)
      }

      if ((config.emailRequired || config.profileRequired) && !scope.includes('read:account')) {
        scope.push('read:account')
      }

      // You can use more secure way to store code_verifier like CF Workers KV, Redis, etc.
      setCookie(event, 'code_verifier', pkce.code_verifier, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 0.5, // 0.5 hour
      })

      // Redirect to Misskey Oauth page
      return sendRedirect(
        event,
        withQuery(authorizationURL as string, {
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: redirectUrl,
          scope: scope.join(' '),
          code_challenge: pkce.code_challenge,
          code_challenge_method: 'S256',
          ...config.authorizationParams,
        }),
      )
    }

    const rememberedCodeVerifier = getCookie(event, 'code_verifier')
    if (rememberedCodeVerifier == null) {
      const error = createError({
        statusCode: 401,
        message: 'PKCE code verifier not found in cookie.',
      })

      if (!onError) throw error
      return onError(event, error)
    }

    const parsedRedirectUrl = parseURL(redirectUrl)
    parsedRedirectUrl.search = ''
    // TODO: improve typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokens: any = await fetch(
      tokenURL as string,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          grant_type: 'authorization_code',
          redirect_uri: stringifyParsedURL(parsedRedirectUrl),
          code: code as string,
          code_verifier: rememberedCodeVerifier,
          scope: scope.join(' '),
        }).toString(),
      },
    ).then((res) => {
      return res.json()
    }).catch((error) => {
      return { error }
    })
    if (tokens.error) {
      const error = createError({
        statusCode: 401,
        message: `Misskey login failed: ${tokens.error?.data?.error_description || 'Unknown error'}`,
        data: tokens,
      })

      if (!onError) throw error
      return onError(event, error)
    }
    const accessToken = tokens.access_token
    // TODO: improve typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: any = await $fetch(`${config.issuer}/api/i`, {
      headers: {
        'user-agent': 'Nuxt Auth Utils',
      },
      method: 'POST',
      body: JSON.stringify({
        i: accessToken,
      }),
    })

    deleteCookie(event, 'code_verifier')

    const host = new URL(config.issuer || 'https://example.com').host;

    return onSuccess(event, {
      tokens,
      user: {
        ...user,
        ...(config.issuer != null ? { host } : {}),
      } as MiEndpoints['i']['res'],
    })
  })
}