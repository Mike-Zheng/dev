import type { Component } from 'vue'
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

export interface ToolDefinition {
  id: string
  group: ToolGroupId
  icon: Component
  /** Extra search keywords (English, from DevToys SearchKeywords) */
  keywords?: string[]
  component: () => Promise<{ default: Component }>
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
