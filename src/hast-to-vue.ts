import { h, type VNode, type Component } from 'vue'
import type { Element, Nodes, Properties } from 'hast'
import { urlAttributes } from 'html-url-attributes'
import type { StreamdownPlugin } from './types/plugin'

export interface HastToVueOptions {
  components?: Record<string, Component | string>
  urlTransform?: (url: string, key: string, node: Element) => string | null | undefined
  allowedElements?: string[]
  disallowedElements?: string[]
  allowElement?: (element: Element, index: number, parent: any) => boolean
  unwrapDisallowed?: boolean
  skipHtml?: boolean
  passNode?: boolean
  plugins?: StreamdownPlugin[]
}

const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)

/**
 * Convert HAST properties to Vue-compatible props.
 * HAST uses className (array), Vue uses class (string/array).
 * HAST uses htmlFor, Vue uses for.
 */
function hastPropsToVue(
  properties: Properties,
  tagName: string,
  node: Element,
  options: HastToVueOptions,
): Record<string, any> {
  const props: Record<string, any> = {}

  for (const key in properties) {
    if (!own(properties, key)) continue
    let value = properties[key]

    // Skip internal properties
    if (key === 'children') continue

    // className -> class
    if (key === 'className') {
      if (Array.isArray(value)) {
        props.class = value.join(' ')
      } else {
        props.class = value
      }
      continue
    }

    // htmlFor -> for
    if (key === 'htmlFor') {
      props.for = value
      continue
    }

    // Handle style as string -> keep as string (Vue handles both)
    if (key === 'style') {
      props.style = value
      continue
    }

    // Transform URLs
    if (options.urlTransform && typeof value === 'string') {
      if (
        urlAttributes[tagName]?.includes(key) ||
        key === 'href' ||
        key === 'src' ||
        key === 'action' ||
        key === 'cite' ||
        key === 'data' ||
        key === 'poster'
      ) {
        const transformed = options.urlTransform(value, key, node)
        if (transformed === null || transformed === undefined) continue
        value = transformed
      }
    }

    // Boolean attributes
    if (value === true) {
      props[key] = true
      continue
    }
    if (value === false) continue

    // Array values (like class lists) -> join with space
    if (Array.isArray(value)) {
      props[key] = value.join(' ')
      continue
    }

    props[key] = value
  }

  return props
}

/**
 * Check if an element should be included based on filtering options.
 */
function shouldIncludeElement(
  node: Element,
  index: number,
  parent: any,
  options: HastToVueOptions,
): boolean {
  const { allowedElements, disallowedElements, allowElement } = options

  if (allowedElements && !allowedElements.includes(node.tagName)) {
    return false
  }

  if (disallowedElements && disallowedElements.includes(node.tagName)) {
    return false
  }

  if (allowElement && !allowElement(node, index, parent)) {
    return false
  }

  return true
}

/**
 * Convert a HAST node to Vue VNode(s).
 */
function nodeToVue(
  node: Nodes,
  index: number,
  parent: Nodes | null,
  options: HastToVueOptions,
): VNode | string | (VNode | string)[] | null {
  switch (node.type) {
    case 'root': {
      const children = childrenToVue(node.children as Nodes[], node, options)
      return children
    }

    case 'element': {
      const element = node

      if (!shouldIncludeElement(element, index, parent, options)) {
        if (options.unwrapDisallowed) {
          return childrenToVue(element.children as Nodes[], element, options)
        }
        return null
      }

      // Check plugins in reverse order (last registered wins)
      if (options.plugins?.length) {
        for (let i = options.plugins.length - 1; i >= 0; i--) {
          const plugin = options.plugins[i]
          if (plugin.match(element)) {
            const children = childrenToVue(element.children as Nodes[], element, options)
            return h(
              plugin.component,
              { node: element },
              children.length > 0 ? children : undefined,
            )
          }
        }
      }

      const component = options.components?.[element.tagName] ?? element.tagName
      const props = hastPropsToVue(element.properties || {}, element.tagName, element, options)

      // Pass the node reference if custom component and passNode enabled
      if (options.passNode && options.components?.[element.tagName]) {
        props.node = element
      }

      const children = childrenToVue(element.children as Nodes[], element, options)

      // Void elements (br, hr, img, input) should not have children
      const voidElements = new Set([
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
      ])

      if (voidElements.has(element.tagName) && children.length === 0) {
        return h(component, props)
      }

      return h(component, props, children.length > 0 ? children : undefined)
    }

    case 'text': {
      return node.value
    }

    case 'comment': {
      return null
    }

    case 'raw': {
      // Raw HTML nodes should have been processed by rehype-raw
      // If they get here, skip them (skipHtml behavior)
      if (options.skipHtml) return null
      return null
    }

    default:
      return null
  }
}

/**
 * Convert an array of HAST children to Vue VNodes.
 */
function childrenToVue(
  children: Nodes[],
  parent: Nodes,
  options: HastToVueOptions,
): (VNode | string)[] {
  const result: (VNode | string)[] = []

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const vnode = nodeToVue(child, i, parent, options)

    if (vnode === null) continue

    if (Array.isArray(vnode)) {
      result.push(...vnode)
    } else {
      result.push(vnode)
    }
  }

  return result
}

/**
 * Convert a HAST tree to Vue VNodes.
 *
 * This replaces hast-util-to-jsx-runtime for Vue.
 * It walks the HAST tree and produces VNodes using Vue's h() function.
 */
export function hastToVue(tree: Nodes, options: HastToVueOptions = {}): (VNode | string)[] {
  const result = nodeToVue(tree, 0, null, options)

  if (result === null) return []
  if (Array.isArray(result)) return result
  return [result]
}
