
import { ChannelData, SocialData } from '../types';

// اعدادات الصورة الشخصية
// لكي تظهر صورتك:
// 1. قم بإنشاء مجلد جديد في الملفات (بجانب index.html) وسمّه "public"
// 2. ضع صورتك داخل مجلد public وغيّر اسمها لتصبح "profile.jpg"
// 3. سيتعرف الموقع عليها تلقائياً
export const profileConfig = {
  image: 'profile.jpg', 
  initials: 'TT'
};

export const telegramChannels: ChannelData[] = [
  {
    id: 'bot_requests',
    name: 'بوت الطلبات',
    description: 'بوت على التيليكرام لاستقبال طلبات التطبيقات والالعاب المعدلة',
    url: 'https://t.me/techtouchAI_bot',
    iconType: 'ai'
  },
  {
    id: 'apps_games',
    name: 'Techtouch7',
    description: 'قناة نشر تطبيقات والعاب اندرويد',
    url: 'https://t.me/techtouch7'
  },
  {
    id: 'discussions',
    name: 'مناقشات Techtouch',
    description: 'تعليقات لحل المشاكل وغيرها',
    url: 'https://t.me/techtouch6'
  },
  {
    id: 'games_channel',
    name: 'قناة الالعاب',
    description: 'نشر العاب اندرو معدلة',
    url: 'https://t.me/techtouch0'
  },
  {
    id: 'games_discuss',
    name: 'مناقشات الالعاب',
    description: 'كروب مناقشة الالعاب',
    url: 'https://t.me/+pScKzHOQwslhMmJi'
  },
  {
    id: 'pc_ps',
    name: 'قناة PC & PS',
    description: 'قناة لنشر مايخص البليستيشن وبرامج الوندوز',
    url: 'https://t.me/techtouch4'
  },
  {
    id: 'pc_ps_discuss',
    name: 'مناقشات PC & PS',
    description: 'مناقشات حول الكمبيوتر والبليستيشن',
    url: 'https://t.me/+J1Up1q8AYgs2MWU6'
  },
  {
    id: 'iphone',
    name: 'قناة الايفون',
    description: 'نشر مايخص الايفون تطبيقات وغيرها',
    url: 'https://t.me/+yqBOH5BBBEM0MTQ6'
  },
  {
    id: 'iphone_discuss',
    name: 'مناقشات الايفون',
    description: 'حل بعض المشاكل للايفون ومناقشتها',
    url: 'https://t.me/+t1W3_jSUjOw0ZDYy'
  },
  {
    id: 'ai',
    name: 'قناة الذكاء الاصطناعي AI',
    description: 'نشر اخبار تقنية واخر اخبار الذكاء الاصطناعي',
    url: 'https://t.me/techtouch_AI'
  },
  {
    id: 'live',
    name: 'قناة البث المباشر',
    description: 'توفير روابط مباشره لكرة القدم',
    url: 'https://t.me/techtouch9'
  },
  {
    id: 'all_folder',
    name: 'المجلد الكامل',
    description: 'للاشتراك بجميع القنوات دفعة واحدة',
    url: 'https://t.me/addlist/Gxcy1FFJONhkMjFi',
    isFolder: true
  }
];

export const socialLinks: SocialData[] = [
  {
    id: 'facebook',
    platform: 'Facebook',
    url: 'https://www.facebook.com/share/1EsapVHA6W/'
  },
  {
    id: 'instagram',
    platform: 'Instagram',
    url: 'https://www.instagram.com/techtouch0'
  },
  {
    id: 'tiktok',
    platform: 'TikTok',
    url: 'https://www.tiktok.com/@techtouch6'
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    url: 'https://youtube.com/@kinanmajeed?si=I2yuzJT2rRnEHLVg'
  }
];

export const footerData = {
  text: 'جميع الحقوق محفوظة كنان الصائغ',
  url: 'https://t.me/kinanmjeed'
};
