import { onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import axios from 'axios'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import { getUserPersonalInformation } from './stores/user.js'

const TWITTER_CONSUMER_KEY = defineSecret('TWITTER_CONSUMER_KEY')
const TWITTER_CONSUMER_SECRET = defineSecret('TWITTER_CONSUMER_SECRET')

export const postToTwitter = onCall(
  {
    secrets: [TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET],
  },
  async (request) => {
    const { user_id, post_comment } = request.data

    if (!user_id || !post_comment) {
      throw new Error('Missing user_id or post_comment')
    }

    const userPersonalInformation = await getUserPersonalInformation(user_id)
    const accessToken = userPersonalInformation?.user_sns_twitter_access_token
    const tokenSecret = userPersonalInformation?.user_sns_twitter_secret

    if (!accessToken || !tokenSecret) {
      throw new Error('Missing Twitter credentials for user. user_id : ' + user_id)
    }

    const oauth = new OAuth({
      consumer: {
        key: TWITTER_CONSUMER_KEY.value(),
        secret: TWITTER_CONSUMER_SECRET.value(),
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64')
      },
    })

    const url = 'https://api.twitter.com/2/tweets'
    const requestData = {
      url,
      method: 'POST',
    }

    const headers = oauth.toHeader(
      oauth.authorize(requestData, {
        key: accessToken,
        secret: tokenSecret,
      }),
    )

    try {
      const response = await axios.post(
        url,
        { text: post_comment },
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        },
      )

      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Twitter post failed:', error?.response?.data || error.message)
      throw new Error('Twitter post failed')
    }
  },
)
