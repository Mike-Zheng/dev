/**
 * Tool registration. Each tool contributes:
 *  - a definition (id, group, icon, lazy component) pushed into `tools`
 *  - its i18n strings (title / short / description / keywords + tool UI strings)
 *
 * Messages are registered eagerly so the sidebar and search can show titles
 * without loading the tool component.
 */
import { registerToolMessages, type ToolMessages } from '@/i18n'
import { tools, type ToolDefinition } from './registry'

export function defineTool(def: ToolDefinition, messages: ToolMessages) {
  registerToolMessages(def.id, messages)
  tools.push(def)
}
