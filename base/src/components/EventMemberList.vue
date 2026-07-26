<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type BokudeliEventMember } from '@shokujii/base/stores/event.js'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import UserAvatar from '@shokujii/base/components/UserAvatar.vue'
import TagBadge from '@shokujii/base/components/TagBadge.vue'
import TagAddChip from '@shokujii/base/components/TagAddChip.vue'
import { getUserPath } from '@/router/utils'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser.js'
import { toggleTagOnMyProfile } from '@shokujii/base/apis/userTags.js'
import { orderTagsWithHighlightFirst } from '@shokujii/base/utils/tagDisplayOrder.js'
import { useNotification } from '@shokujii/base/composable/notification.js'

const { t: $t } = useI18n()

defineProps<{
  members: BokudeliEventMember[]
  eventMaxPeople: number
  isShowMember: boolean
}>()

const currentUserStore = useCurrentUserStore()
const notification = useNotification()
const myTags = computed(() => new Set(currentUserStore.user?.user_tags ?? []))

const isTagHighlighted = (tag: string) => myTags.value.has(tag)

const orderedUserTags = (member: BokudeliEventMember) =>
  orderTagsWithHighlightFirst(member.user_tags ?? [], isTagHighlighted)

const isCurrentUser = (member: BokudeliEventMember) => member.user_id === currentUserStore.firebaseUser?.uid

const showMemberTags = (member: BokudeliEventMember) => (member.user_tags ?? []).length > 0 || isCurrentUser(member)

const onMemberTagClick = async (tag: string) => {
  const uid = currentUserStore.firebaseUser?.uid
  if (uid == null) {
    notification.show($t('event_details.tag_toggle_login_required'), 'error')
    return
  }
  try {
    const r = await toggleTagOnMyProfile(tag, currentUserStore.user?.user_tags)
    notification.show(
      r === 'added' ? $t('event_details.tag_toggle_added') : $t('event_details.tag_toggle_removed'),
      'success',
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : $t('event_details.tag_toggle_failed')
    notification.show(msg, 'error')
  }
}

function groupOrderedMenus(orders: EventMemberOrder[]): [string, { name: string; count: number }][] {
  const map: Record<string, { name: string; count: number }> = {}
  for (const o of orders) {
    if (o.status !== 'ordered') continue
    if (!map[o.menu_id]) map[o.menu_id] = { name: o.menu_name, count: 0 }
    map[o.menu_id].count++
  }
  return Object.entries(map)
}
</script>
<template>
  <section>
    <v-card-text class="text-left">
      <v-row v-if="isShowMember === true">
        <v-col v-for="member in members" :key="member.user_id" class="d-flex align-stretch pa-2" cols="6" sm="6" md="4">
          <v-sheet class="event-member-tile d-flex flex-column w-100 h-100 pa-3" rounded="lg">
            <router-link
              :to="getUserPath(member.user_id)"
              class="event-member-tile__profile-link cursor-pointer text-decoration-none"
            >
              <div class="d-flex align-start">
                <UserAvatar :user="member" :size="60" class="flex-shrink-0" />
                <div class="pl-2 min-width-0 flex-grow-1 overflow-hidden">
                  <div class="event-member-tile__name font-weight-bold text-truncate" :title="member.user_name">
                    {{ member.user_name }}
                  </div>
                  <div
                    v-for="[menuId, group] in groupOrderedMenus(member.orders)"
                    :key="menuId"
                    class="d-flex align-center"
                    style="font-size: 12px; color: gray"
                  >
                    <div>
                      <span>{{ group.name }}</span>
                      <span v-if="group.count > 1"> {{ $t('event_details.order_count', [group.count]) }} </span>
                    </div>
                  </div>
                </div>
              </div>
            </router-link>
            <div v-if="showMemberTags(member)" class="d-flex flex-wrap mt-2 w-100">
              <TagBadge
                v-for="t in orderedUserTags(member)"
                :key="t"
                :tag="t"
                compact
                :highlighted="isTagHighlighted(t)"
                :clickable="!isCurrentUser(member)"
                @click="onMemberTagClick(t)"
              />
              <TagAddChip v-if="isCurrentUser(member)" compact />
            </div>
          </v-sheet>
        </v-col>
      </v-row>
      <!-- コミュニティの設定によっては参加者氏名を非表示にし、リンクをなくす -->
      <v-row v-else-if="isShowMember === false">
        <v-col v-for="member in members" :key="member.user_id" class="d-flex align-stretch pa-2" cols="6" sm="6" md="4">
          <v-sheet class="event-member-tile d-flex flex-column w-100 h-100 pa-3" rounded="lg">
            <div class="d-flex align-start">
              <UserAvatar :user="member" :size="60" class="flex-shrink-0" />
              <div class="pl-2 min-width-0 flex-grow-1">
                <div
                  v-for="[menuId, group] in groupOrderedMenus(member.orders)"
                  :key="menuId"
                  class="d-flex align-center"
                  style="font-size: 12px; color: gray"
                >
                  <div>
                    <span>{{ group.name }}</span>
                    <span v-if="group.count > 1"> {{ $t('event_details.order_count', [group.count]) }} </span>
                  </div>
                </div>
              </div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
      <slot></slot>
    </v-card-text>
  </section>
</template>

<style scoped lang="scss">
.event-member-tile {
  background-color: rgba(var(--v-theme-background), 38%);
}

.event-member-tile__name {
  font-size: 0.9375rem;
  line-height: 1.375rem;
}

.event-member-tile__profile-link {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));

  &:hover {
    opacity: 0.75;
  }
}
</style>
