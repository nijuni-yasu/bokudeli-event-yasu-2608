export type RequestEmailLoginRequest = { email: string }
export type RequestEmailLoginResponse = { isNew: boolean }

export type ConfirmEmailLoginRequest = { email: string; passCode: string }
export type ConfirmEmailLoginResponse = { token: string }

export type RequestEmailChangeRequest = { newEmail: string }

export type ConfirmEmailChangeRequest = { newEmail: string; passCode: string }
