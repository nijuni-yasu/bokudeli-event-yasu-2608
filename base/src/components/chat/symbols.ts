import type { InjectionKey, Ref } from 'vue'

/** ライトボックス表示中は ChatAttachmentImage が Object URL を revoke しない */
export const injectionKeyChatAttachmentLightboxPin: InjectionKey<Ref<boolean>> = Symbol('chatAttachmentLightboxPin')
