import type { VNode, VNodeChild } from 'vue'

const collectTextFromChild = (child: VNodeChild): string => {
  if (child == null || typeof child === 'boolean') {
    return ''
  }
  if (typeof child === 'string' || typeof child === 'number') {
    return String(child)
  }
  if (Array.isArray(child)) {
    return child.map((item) => collectTextFromChild(item)).join('')
  }
  return extractPlainTextFromVNode(child)
}

export const extractPlainTextFromVNode = (vNode: VNode): string => {
  const { children } = vNode
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map((child) => collectTextFromChild(child)).join('')
  }
  if (children != null && typeof children === 'object' && 'default' in children) {
    return collectTextFromChild(children.default?.())
  }
  return ''
}
