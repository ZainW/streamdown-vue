import { defineComponent, h } from 'vue'
import { DownloadIcon } from '../icons/index'
import { save } from '../../../lib/utils'

export const CodeBlockDownloadButton = defineComponent({
  name: 'CodeBlockDownloadButton',
  props: {
    code: { type: String, required: true },
    language: { type: String, default: 'txt' },
  },
  setup(props) {
    function handleDownload() {
      const ext = props.language || 'txt'
      save(props.code, `code.${ext}`, 'text/plain')
    }

    return () =>
      h(
        'button',
        {
          type: 'button',
          'data-streamdown': 'code-download-button',
          title: 'Download code',
          'aria-label': 'Download code',
          onClick: handleDownload,
          class: 'inline-flex items-center justify-center rounded p-1 transition-colors',
        },
        [h(DownloadIcon)],
      )
  },
})
