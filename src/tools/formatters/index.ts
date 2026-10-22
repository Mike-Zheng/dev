import { Braces, Database, CodeXml } from 'lucide-vue-next'
import { defineTool } from '../registry'

defineTool(
  { id: 'json-formatter', group: 'formatters', icon: Braces, keywords: ['json', 'sort', 'order', 'alphabetize', 'prettify', 'minify'], component: () => import('./JsonFormatterTool.vue') },
  {
    en: {
      title: 'JSON Formatter',
      short: 'JSON',
      description: 'Indent or minify JSON data',
      keywords: 'json format prettify minify',
      indentationDesc: 'Select which indentation you want to use',
      sort: 'Sort JSON properties alphabetically',
      sortDesc: 'Whether properties within the JSON should be sorted alphabetically',
      invalid: 'Invalid JSON',
    },
    'zh-TW': {
      title: 'JSON 格式化工具',
      short: 'JSON',
      description: '縮排或最小化 JSON 資料',
      keywords: 'json 格式化 美化 壓縮',
      indentationDesc: '選擇您想要使用的縮排方式',
      sort: '依字母順序排序 JSON 屬性',
      sortDesc: 'JSON 內的屬性是否依字母順序排序',
      invalid: '無效的 JSON',
    },
  },
)

defineTool(
  { id: 'sql-formatter', group: 'formatters', icon: Database, keywords: ['sql', 'query', 'mysql', 'postgres', 'tsql'], component: () => import('./SqlFormatterTool.vue') },
  {
    en: {
      title: 'SQL Formatter',
      short: 'SQL',
      description: 'Format SQL data',
      keywords: 'sql format query',
      language: 'Language',
      languageDesc: 'Which SQL dialect to use',
      indentationDesc: 'Select which indentation you want to use',
      keywordCase: 'Keyword case',
      keywordCaseDesc: 'Convert reserved keywords to upper or lower case',
      preserve: 'Preserve',
      upper: 'UPPER',
      lower: 'lower',
      invalid: 'Unable to format the SQL',
    },
    'zh-TW': {
      title: 'SQL 格式化工具',
      short: 'SQL',
      description: '格式化 SQL 資料',
      keywords: 'sql 格式化 查詢',
      language: '語言',
      languageDesc: '要使用的 SQL 方言',
      indentationDesc: '選擇您想要使用的縮排方式',
      keywordCase: '關鍵字大小寫',
      keywordCaseDesc: '將保留關鍵字轉為大寫或小寫',
      preserve: '保留',
      upper: '大寫',
      lower: '小寫',
      invalid: '無法格式化此 SQL',
    },
  },
)

defineTool(
  { id: 'xml-formatter', group: 'formatters', icon: CodeXml, keywords: ['xml', 'prettify', 'minify'], component: () => import('./XmlFormatterTool.vue') },
  {
    en: {
      title: 'XML Formatter',
      short: 'XML',
      description: 'Indent or minify XML data',
      keywords: 'xml format prettify minify',
      indentationDesc: 'Select which indentation you want to use',
      collapse: 'Collapse content',
      collapseDesc: 'Keep text content on the same line as its element',
      invalid: 'Invalid XML',
    },
    'zh-TW': {
      title: 'XML 格式化工具',
      short: 'XML',
      description: '縮排或最小化 XML 資料',
      keywords: 'xml 格式化 美化 壓縮',
      indentationDesc: '選擇您想要使用的縮排方式',
      collapse: '合併文字內容',
      collapseDesc: '將文字內容與其元素保持在同一行',
      invalid: '無效的 XML',
    },
  },
)
