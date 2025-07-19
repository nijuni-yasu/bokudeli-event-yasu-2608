/*
 * This directive is inspired by the v-linkify
 * https://github.com/maorbarel/v-linkify
 */
import type { DirectiveBinding, VNode } from 'vue'
import findLinksAndReplace from './utils/findLinksAndReplace'

export default {
  mounted(el: Node) {
    findLinksAndReplace(el)
  },
  updated(el: Node, _: DirectiveBinding, vNode: VNode<HTMLElement, Node>) {
    if (!(vNode instanceof Element) || !(vNode?.children?.[0] instanceof HTMLElement)) {
      return
    }
    const newEl = el
    newEl.textContent = vNode?.children?.[0]?.innerText ?? ''
    findLinksAndReplace(newEl)
  },
}
