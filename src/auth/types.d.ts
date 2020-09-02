// interim types for Feather as it has no types yet

export interface AuthTokenFromFeather {
  idToken: string //"POIUYL.LKJHGF.MNBVCX",
  refreshToken: string // "foobar"
}

export interface AuthedFeatherUser {
  id: string // "USR_bf1c72fd-d0d7-486e-ad85-890f4524ce36",
  object: string // "user",
  created_at: string // "2020-05-01T22:22:25.000000Z",
  email: string // "jdoe@example.com",
  is_anonymous: boolean // false,
  is_email_verified: boolean // true,
  metadata: any //{},
  tokens: AuthTokenFromFeather
  updated_at: string // "2020-05-01T22:22:25.000000Z",
}

export interface FeatherCurrentUserHookInterface {
  loading: boolean
  currentUser: AuthedFeatherUser
}
