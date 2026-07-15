/*
 * This directive is inspired by the v-linkify
 * https://github.com/maorbarel/v-linkify
 */
import type { DirectiveBinding, VNode } from 'vue'
import { extractPlainTextFromVNode } from './utils/extractPlainTextFromVNode.js'
import findLinksAndReplace from './utils/findLinksAndReplace.js'

const linkifyElement = (el: Node, vNode: VNode): void => {
  if (!(el instanceof HTMLElement)) {
    return
  }
  const plainText = extractPlainTextFromVNode(vNode)
  findLinksAndReplace(el, plainText)
}

export default {
  mounted(el: Node, _: DirectiveBinding, vNode: VNode) {
    linkifyElement(el, vNode)
  },
  updated(el: Node, _: DirectiveBinding, vNode: VNode) {
    linkifyElement(el, vNode)
  },
}
