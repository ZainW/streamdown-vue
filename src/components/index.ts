import type { Component } from 'vue'
import {
  H1, H2, H3, H4, H5, H6,
} from './headings'
import { P, Strong, Em, Del, Sub, Sup } from './text'
import { Ol, Ul, Li } from './lists'
import { A } from './links'
import { Blockquote } from './blockquote'
import { Code, Pre } from './code'
import { Img } from './image'
import { Hr } from './hr'
import {
  Table, Thead, Tbody, Tr, Th, Td,
} from './table'

/**
 * Default component map for all markdown elements.
 * Each component includes data-streamdown attributes for CSS targeting.
 */
export const defaultComponents: Record<string, Component> = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  p: P,
  strong: Strong,
  em: Em,
  del: Del,
  sub: Sub,
  sup: Sup,
  ol: Ol,
  ul: Ul,
  li: Li,
  a: A,
  blockquote: Blockquote,
  code: Code,
  pre: Pre,
  img: Img,
  hr: Hr,
  table: Table,
  thead: Thead,
  tbody: Tbody,
  tr: Tr,
  th: Th,
  td: Td,
}
