/** エンプライベントか（Event / Community の enterprise_id） */
export function isEnterpriseEvent(event: { enterprise_id?: string | null }): boolean {
  return event.enterprise_id != null && event.enterprise_id !== ''
}

/** エンプラ従業員 uid か（/users.enterprise_id。認証 lookup 正本の members とは別） */
export function isEnterpriseUser(user: { enterprise_id?: string | null }): boolean {
  return user.enterprise_id != null && user.enterprise_id !== ''
}
