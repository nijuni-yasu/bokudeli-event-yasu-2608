import { Timestamp } from "firebase-admin/firestore"

export const event_information_default = {
    'communities/5oxesNeS5dO078qABR98/events': {
        '1stEvent': {
            is_public: true,
            event_status: {
                value: 'accepting_order'
            },
            event_start_datetime: Timestamp.fromDate(new Date('2024-01-18T00:00:00Z')),
            event_end_datetime: Timestamp.fromDate(new Date('2024-01-18T02:00:00Z')),
            event_deadline_datetime: Timestamp.fromDate(new Date('2024-01-16T00:00:00Z')),
            event_name: '1st event',
            event_address: '東京都渋谷区1',
            event_desc: '1st event description',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/1st.png',
            event_max_people: 10,
            community_name: 'ぼくデリ1',
            partner_id: 'partner1',
            shop_id: 'shop11',
            shop_name: 'Shop 11',
        },
        '3rdEvent': {
            is_public: true,
            event_status: {
                value: 'accepting_order'
            },
            event_start_datetime: Timestamp.fromDate(new Date('2024-02-02T08:00:00Z')),
            event_end_datetime: Timestamp.fromDate(new Date('2024-02-02T11:00:00Z')),
            event_deadline_datetime: Timestamp.fromDate(new Date('2024-01-25T05:00:00Z')),
            event_name: '3rd event',
            event_address: '東京都渋谷区3',
            event_desc: '3rd event description',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/3rd.png',
            event_max_people: 3,
            community_name: 'ぼくデリ3',
            partner_id: 'partner2',
            shop_id: 'shop21',
            shop_name: 'Shop 21',
        },
        'NonPublicEvent': {
            is_public: false,
            event_status: {
                value: 'accepting_order'
            },
            event_start_datetime: Timestamp.fromDate(new Date('2024-01-27T18:00:00Z')),
            event_end_datetime: Timestamp.fromDate(new Date('2024-01-27T20:00:00Z')),
            event_deadline_datetime: Timestamp.fromDate(new Date('2024-01-26T18:00:00Z')),
            event_name: 'no public event',
            event_address: '東京都渋谷区∞',
            event_desc: 'no public event description',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/no-public.png',
            event_max_people: 10,
            shop_name: 'no public shop',
            community_name: 'ぼくデリ∞',
            partner_id: 'partner2',
            shop_id: 'shop22',
            shop_name: 'Shop 22',
        },
        'FullCapacityEvent': {
            is_public: true,
            event_status: {
                value: 'accepting_order'
            },
            event_start_datetime: Timestamp.fromDate(new Date('2024-01-28T18:00:00Z')),
            event_end_datetime: Timestamp.fromDate(new Date('2024-01-28T20:00:00Z')),
            event_deadline_datetime: Timestamp.fromDate(new Date('2024-01-27T18:00:00Z')),
            event_name: 'full capacity event',
            event_address: '東京都渋谷区F',
            event_desc: 'full capacity event description',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/full-capacity.png',
            event_max_people: 1,
            community_name: 'ぼくデリFull',
            partner_id: 'partner1',
            shop_id: 'shop11',
            shop_name: 'Shop 11',
        },
        'InDraftEvent': {
            is_public: true,
            event_status: {
                value: 'in_draft'
            },
            event_start_datetime: Timestamp.fromDate(new Date('2024-01-29T18:00:00Z')),
            event_end_datetime: Timestamp.fromDate(new Date('2024-01-29T20:00:00Z')),
            event_deadline_datetime: Timestamp.fromDate(new Date('2024-01-28T18:00:00Z')),
            event_name: 'in draft event',
            event_address: '東京都渋谷区D',
            event_desc: 'in draft event description',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/in-draft.png',
            event_max_people: 10,
            community_name: 'ぼくデリDraft',
            partner_id: 'partner1',
            shop_id: 'shop12',
            shop_name: 'Shop 12',
        },
        '2ndEvent': {
            is_public: true,
            event_status: {
                value: 'accepting_order'
            },
            event_start_datetime: Timestamp.fromDate(new Date('2024-01-18T02:00:00Z')),
            event_end_datetime: Timestamp.fromDate(new Date('2024-01-18T04:00:00Z')),
            event_deadline_datetime: Timestamp.fromDate(new Date('2024-01-16T02:00:00Z')),
            event_name: '2nd event',
            event_address: '東京都渋谷区2',
            event_desc: '2nd event description',
            event_cover_url: 'https://firebasestorage.googleapis.com/v0/b/test.appspot.com/2nd.png',
            event_max_people: 10,
            community_name: 'ぼくデリ2',
            partner_id: 'partner2',
            shop_id: 'shop22',
            shop_name: 'Shop 22',
        },
    },
    'communities/5oxesNeS5dO078qABR98/events/1stEvent/orders': {
        'order1': {
            user_id: 'user1',
        },
        'order2': {
            user_id: 'user1',
        },
        'order3': {
            user_id: 'user2',
        },
    },
    'communities/5oxesNeS5dO078qABR98/events/2ndEvent/orders': {
        'order1': {
            user_id: 'user1',
        },
        'order2': {
            user_id: 'user2',
        },
        'order3': {
            user_id: 'user3',
        },
    },
    'communities/5oxesNeS5dO078qABR98/events/3rdEvent/orders': {
        'order1': {
            user_id: 'user2',
        },
        'order2': {
            user_id: 'user2',
        },
        'order3': {
            user_id: 'user2',
        },
    },
    'communities/5oxesNeS5dO078qABR98/events/FullCapacityEvent/orders': {
        'order1': {
            user_id: 'user1',
        },
    },
    'communities/5oxesNeS5dO078qABR98/events/NonPublicEvent/orders': {
        'order1': {
            user_id: 'user1',
        },
        'order2': {
            user_id: 'user2',
        },
    },
    'users': {
        'user1': {
            user_name: 'Ichiro',
            user_email: 'ichiro@test.com',
        },
        'user2': {
            user_name: 'Jiro',
            user_email: 'jiro@test.com',
        },
        'user3': {
            user_name: 'Saburo',
            user_email: 'sab@test.com',
        }
    },
    'partners/partner1/shops': {
        'shop11': {
            'shop_name': 'Shop 11',
        },
        'shop12': {
            'shop_name': 'Shop 12',
        }
    },
    'partners/partner2/shops': {
        'shop21': {
            'shop_name': 'Shop 21',
        },
        'shop22': {
            'shop_name': 'Shop 22',
            'shop_email': 'main@mail.com',
            'shop_email_sub1': 'sub1@mail.com',
            'shop_email_sub2': 'sub2@mail.com',
            'shop_email_sub3': 'sub3@mail.com'
        }
    }
}