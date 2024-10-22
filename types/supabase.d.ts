import '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  export type Provider =
    | 'anonymous'
    | 'google'
    | 'github'
    | 'facebook'
    | 'twitter'
    | 'apple'
    | 'azure'
    | 'bitbucket'
    | 'gitlab'
    | 'linkedin'
    | 'slack'
    | 'spotify'
    | 'twitch'
    | 'discord'
    | 'zoom'
    | 'notion'
    | 'workos'
    | 'keycloak'
    | 'okta'
    | 'saml'
    | 'oidc';
}
