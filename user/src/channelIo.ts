import * as ChannelService from '@channel.io/channel-web-sdk-loader'

// チャネルトークスクリプト読み込み
ChannelService.loadScript()

const pluginKey = import.meta.env.VITE_CHANNEL_IO_PLUGIN_KEY
if (pluginKey) {
  ChannelService.boot({ pluginKey: import.meta.env.VITE_CHANNEL_IO_PLUGIN_KEY, hideChannelButtonOnBoot: true })
} else {
  console.error('ChannelService plugin key is not defined')
}
