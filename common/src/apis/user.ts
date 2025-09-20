export type CreateOrUpdateUserRequset =
  | {
      user_pass_code: string
      user_email: string
    }
  | {
      user_pass_code: string
      user_email_pending: string
    }

export type CreateOrUpdateUserResponse = {
  is_new: boolean
}

export type VerifyPassCodeRequest =
  | {
      user_pass_code: string
      user_email: string
    }
  | {
      user_pass_code: string
      user_email_pending: string
    }
export type VerifyPassCodeResponse = string

export type GetCustomTokenRequest = {
  user_email: string
}
export type GetCustomTokenResponse = string
