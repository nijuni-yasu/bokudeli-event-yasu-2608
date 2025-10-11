import { User } from '../schemas/User.js'

export type RequestEmailLoginRequest = { email: string }
export type RequestEmailLoginResponse = { isNew: boolean }

export type ConfirmEmailLoginRequest = { email: string; passCode: string }
export type ConfirmEmailLoginResponse = { token: string; isNew: boolean }

export type RequestEmailChangeRequest = { newEmail: string }

export type ConfirmEmailChangeRequest = { newEmail: string; passCode: string }
export type ConfirmEmailChangeResponse = { token: string }

export type UpdateProfileFromProvidersRequest = { additinalInfo: Partial<User> }
export type UpdateProfileFromProvidersResponse = { user: User & { user_email?: string } }
