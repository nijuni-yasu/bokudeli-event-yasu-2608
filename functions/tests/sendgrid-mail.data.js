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
            shop_name: '1st shop',
            community_name: 'ぼくデリ1',
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
            shop_name: '3rd shop',
            community_name: 'ぼくデリ3',
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
            shop_name: 'full capacity shop',
            community_name: 'ぼくデリFull',
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
            shop_name: 'in draft shop',
            community_name: 'ぼくデリDraft',
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
            shop_name: '2nd shop',
            community_name: 'ぼくデリ2',
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
    }
}