export type UpdateUserTagsRequest = { tags: string[] }
export type UpdateUserTagsResponse = { success: boolean; message: string }

export type AddTagToMyProfileRequest = { tag: string }
export type AddTagToMyProfileResponse = { success: boolean; message: string }

export type RemoveTagFromMyProfileRequest = { tag: string }
export type RemoveTagFromMyProfileResponse = { success: boolean; message: string }
