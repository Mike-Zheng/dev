import type { Component } from 'vue'
import { registerToolMessages, type ToolMessages } from '@/i18n'
import {
  ArrowLeftRight,
  Binary,
  Braces,
  Sparkles,
  Image,
  FlaskConical,
  Type,
} from 'lucide-vue-next'

export type ToolGroupId = 'converters' | 'encoders' | 'formatters' | 'generators' | 'graphic' | 'testers' | 'text'

export interface ToolGroup {
  id: ToolGroupId
  icon: Component
}

interface ToolBase {
  id: string
  group: ToolGroupId
  icon: Component
  /** Extra English search keywords */
  keywords?: string[]
}

export type InternalToolDefinition = ToolBase & { component: () => Promise<{ default: Component }>; href?: never }
export type ExternalToolDefinition = ToolBase & { href: string; component?: never }

/** A tool rendered inside this app, or an external link that opens `href` in a new tab. */
export type ToolDefinition = InternalToolDefinition | ExternalToolDefinition

export function isExternalTool(tool: ToolDefinition): tool is ExternalToolDefinition {
  return typeof tool.href === 'string'
}

export const groups: ToolGroup[] = [
  { id: 'converters', icon: ArrowLeftRight },
  { id: 'encoders', icon: Binary },
  { id: 'formatters', icon: Braces },
  { id: 'generators', icon: Sparkles },
  { id: 'graphic', icon: Image },
  { id: 'testers', icon: FlaskConical },
  { id: 'text', icon: Type },
]

export const tools: ToolDefinition[] = []

export function toolsOfGroup(group: ToolGroupId): ToolDefinition[] {
  return tools.filter((t) => t.group === group)
}

export function findTool(id: string): ToolDefinition | undefined {
  return tools.find((t) => t.id === id)
}

/** Register a tool and its i18n strings (eagerly, so sidebar/search can show titles). */
export function defineTool(def: ToolDefinition, messages: ToolMessages) {
  registerToolMessages(def.id, messages)
  tools.push(def)
}
