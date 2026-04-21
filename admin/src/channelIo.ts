import * as ChannelService from '@channel.io/channel-web-sdk-loader'

ChannelService.loadScript()

const pluginKey = import.meta.env.VITE_CHANNEL_IO_PLUGIN_KEY
if (pluginKey) {
  ChannelService.boot({
    pluginKey,
    hideChannelButtonOnBoot: true,
  })
} else {
  console.error('ChannelService plugin key is not defined')
}
