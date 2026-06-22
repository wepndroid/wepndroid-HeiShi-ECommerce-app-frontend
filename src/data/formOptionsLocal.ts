import type { ListingFormOptionsDto } from '../api/types';

/** Offline fallback — keep in sync with Backend/app/form_options.py */
export const MOCK_FORM_OPTIONS: ListingFormOptionsDto = {
  categories: [
    { key: 'digital', labelEn: 'Used digital', labelZh: '二手数码' },
    { key: 'home', labelEn: 'Home goods', labelZh: '家居日用' },
    { key: 'fashion', labelEn: 'Fashion & bags', labelZh: '服饰箱包' },
    { key: 'beauty', labelEn: 'Beauty & care', labelZh: '美妆个护' },
    { key: 'misc', labelEn: 'Misc items', labelZh: '其他好物' },
    { key: 'tickets', labelEn: 'Tickets', labelZh: '票券' },
    { key: 'motorcycle', labelEn: 'Motorcycle', labelZh: '摩托车' },
    { key: 'textbooks', labelEn: 'Textbooks', labelZh: '教材资料' },
  ],
  conditions: [
    { key: 'brandNew', labelEn: 'Brand new', labelZh: '全新' },
    { key: 'likeNew95', labelEn: '95% new', labelZh: '95新' },
    { key: 'likeNew90', labelEn: '90% new', labelZh: '90新' },
    { key: 'lightlyUsed', labelEn: 'Lightly used', labelZh: '轻微使用' },
    { key: 'withFilm', labelEn: 'Includes film', labelZh: '含相纸' },
    { key: 'foldable', labelEn: 'Foldable', labelZh: '可折叠' },
    { key: 'fullAccessories', labelEn: 'Full accessories', labelZh: '配件齐全' },
  ],
  pickupMethods: [
    { key: 'meetup', labelEn: 'Local pickup', labelZh: '同城自取' },
    { key: 'express', labelEn: 'Express shipping', labelZh: '快递邮寄' },
    { key: 'delivery', labelEn: 'Delivery available', labelZh: '可送货' },
  ],
  deliveryMethods: [
    { key: 'meetup', labelEn: 'Local pickup', labelZh: '同城自取' },
    { key: 'express', labelEn: 'Express shipping', labelZh: '快递邮寄' },
  ],
  serviceTypes: [
    { key: 'moving', labelEn: 'Moving help', labelZh: '搬家帮手' },
    { key: 'cleaning', labelEn: 'Home cleaning', labelZh: '家庭清洁' },
    { key: 'photography', labelEn: 'Product photography', labelZh: '商品摄影' },
    { key: 'tutoring', labelEn: 'Tutoring & coaching', labelZh: '陪练辅导' },
    { key: 'repair', labelEn: 'Repair & assembly', labelZh: '维修组装' },
    { key: 'other', labelEn: 'Other service', labelZh: '其他服务' },
  ],
  serviceAreas: [
    { key: 'clayton', labelEn: 'Clayton', labelZh: '克莱顿' },
    { key: 'box_hill', labelEn: 'Box Hill', labelZh: '博士山' },
    { key: 'melbourne_cbd', labelEn: 'Melbourne CBD', labelZh: '墨尔本市中心' },
    { key: 'southbank', labelEn: 'Southbank', labelZh: '南岸' },
    { key: 'carlton', labelEn: 'Carlton', labelZh: '卡尔顿' },
    { key: 'burwood', labelEn: 'Burwood', labelZh: '布林伍德' },
    { key: 'glen_waverley', labelEn: 'Glen Waverley', labelZh: '格伦韦弗利' },
    { key: 'online', labelEn: 'Online / remote', labelZh: '线上服务' },
  ],
  serviceTimeSlots: [
    { key: 'weekday_evening', labelEn: 'Weekday evenings', labelZh: '工作日晚间' },
    { key: 'weekend', labelEn: 'Weekends', labelZh: '周末' },
    { key: 'flexible', labelEn: 'Flexible schedule', labelZh: '时间灵活' },
    { key: 'by_appointment', labelEn: 'By appointment', labelZh: '预约制' },
  ],
};