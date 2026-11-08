/** Language registry: public landing URL, search title, and the existing site tabs. */
export const LANG_ORDER = ['en', 'nb', 'sv', 'da', 'fi', 'de', 'nl', 'fr', 'es', 'it', 'pt-BR', 'pl', 'tr', 'ja', 'ko', 'zh-Hans', 'hi', 'id', 'ar'];

export const META = {
  en: {
    path: '/wishlist/', hreflang: 'en', htmlLang: 'en', dir: 'ltr', home: '/',
    ideas: '/christmas-gifts-us/', navAria: 'Main menu',
    title: 'Wishlist and gift list – create and share | GiveOwl',
    description: 'Create a wishlist, wish list or Christmas gift list and share a view link with your family. No account. GiveOwl by HENDT AS.',
    tabs: [['f-hjem', '/', 'Home'], ['f-konk', '/c/us/', 'Sweepstakes'], ['f-kal', '/advent-calendars-us/', 'Advent calendars'], ['f-bw', '/deals-us/', 'Black Friday'], ['f-gave', '/christmas-gifts-us/', 'Gift ideas'], ['f-guide', '/guide/', 'Guides']],
  },
  nb: {
    path: '/onskeliste/', hreflang: 'nb', htmlLang: 'nb', dir: 'ltr', home: '/nb/',
    ideas: '/julegaveideer/', navAria: 'Hovedmeny',
    title: 'Ønskeliste – lag og del en juleønskeliste | GiveOwl',
    description: 'Lag en ønskeliste eller juleønskeliste og del en visningslenke. Ingen konto. Familien kan reservere gaver. GiveOwl fra HENDT AS.',
    tabs: [['f-hjem', '/nb/', 'Forside'], ['f-konk', '/c/no/', 'Konkurranser'], ['f-kal', '/c/no/julekalender/', 'Julekalendere'], ['f-bw', '/nb/tilbud/', 'Black Week'], ['f-gave', '/julegaveideer/', 'Julegaver'], ['f-guide', '/nb/guide/', 'Guider']],
  },
  sv: {
    path: '/sv/onskelista/', hreflang: 'sv', htmlLang: 'sv', dir: 'ltr', home: '/sv/',
    ideas: '/sv/julklappstips/', navAria: 'Huvudmeny',
    title: 'Önskelista – skapa och dela julönskelista | GiveOwl',
    description: 'Skapa en önskelista eller julklappslista och dela en visningslänk. Inget konto. Familjen kan reservera julklappar. GiveOwl från HENDT AS.',
    tabs: [['f-hjem', '/sv/', 'Startsida'], ['f-konk', '/c/se/', 'Tävlingar'], ['f-kal', '/c/se/julkalender/', 'Julkalendrar'], ['f-bw', '/c/se/black-week-tavlingar/', 'Black Week'], ['f-gave', '/sv/julklappstips/', 'Julklappstips'], ['f-guide', '/sv/guide/', 'Guider']],
  },
  da: {
    path: '/da/onskeseddel/', hreflang: 'da', htmlLang: 'da', dir: 'ltr', home: '/da/',
    ideas: '/da/julegaveideer/', navAria: 'Hovedmenu',
    title: 'Ønskeseddel – lav og del en juleønskeseddel | GiveOwl',
    description: 'Lav en ønskeseddel eller ønskeliste og del et visningslink. Ingen konto. Familien kan reservere gaver. GiveOwl fra HENDT AS.',
    tabs: [['f-hjem', '/da/', 'Forside'], ['f-konk', '/c/dk/', 'Konkurrencer'], ['f-kal', '/c/dk/julekalender/', 'Julekalendere'], ['f-bw', '/c/dk/black-week-konkurrencer/', 'Black Week'], ['f-gave', '/da/julegaveideer/', 'Julegaveideer'], ['f-guide', '/da/guide/', 'Guider']],
  },
  fi: {
    path: '/fi/toivelista/', hreflang: 'fi', htmlLang: 'fi', dir: 'ltr', home: '/fi/',
    ideas: '/fi/', navAria: 'Päävalikko',
    title: 'Toivelista – tee ja jaa lahjatoivelista | GiveOwl',
    description: 'Tee toivelista tai joululahjatoivelista ja jaa katselulinkki. Ei tiliä. Läheiset voivat varata lahjoja. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/fi/', 'Etusivu'], ['f-konk', '/c/fi/', 'Arvonnat'], ['f-kal', '/c/fi/joulukalenteri/', 'Joulukalenterit']],
  },
  de: {
    path: '/de/wunschliste/', hreflang: 'de', htmlLang: 'de', dir: 'ltr', home: '/de/',
    ideas: '/de/geschenkideen/', navAria: 'Hauptmenü',
    title: 'Wunschliste und Wunschzettel erstellen | GiveOwl',
    description: 'Wunschliste erstellen und einen Ansichtslink teilen. Kein Konto. Die Familie kann Geschenke reservieren. Auch als Wunschzettel zu Weihnachten. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/de/', 'Startseite'], ['f-konk', '/c/de/', 'Gewinnspiele'], ['f-kal', '/c/de/adventskalender/', 'Adventskalender'], ['f-bw', '/de/angebote/', 'Black Week'], ['f-gave', '/de/geschenkideen/', 'Geschenkideen'], ['f-guide', '/de/ratgeber/', 'Ratgeber']],
  },
  nl: {
    path: '/nl/verlanglijstje/', hreflang: 'nl', htmlLang: 'nl', dir: 'ltr', home: '/nl/',
    ideas: '/nl/', navAria: 'Hoofdmenu',
    title: 'Verlanglijstje maken en delen | GiveOwl',
    description: 'Maak een verlanglijstje voor Sinterklaas of kerst en deel een bekijklink. Geen account. Anderen kunnen cadeaus reserveren. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/nl/', 'Home'], ['f-konk', '/c/nl/', 'Winacties'], ['f-kal', '/c/nl/advent-calendars/', 'Adventskalenders'], ['f-guide', '/nl/gids/', 'Gidsen']],
  },
  fr: {
    path: '/fr/liste-de-souhaits/', hreflang: 'fr', htmlLang: 'fr', dir: 'ltr', home: '/fr/',
    ideas: '/fr/', navAria: 'Menu principal',
    title: 'Liste de souhaits et liste d’envies | GiveOwl',
    description: 'Créez une liste de souhaits ou une liste d’envies et partagez un lien de consultation. Sans compte. La famille peut réserver les cadeaux. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/fr/', 'Accueil'], ['f-konk', '/c/fr/', 'Jeux-concours'], ['f-guide', '/fr/guide/', 'Guides']],
  },
  es: {
    path: '/es/lista-de-deseos/', hreflang: 'es', htmlLang: 'es', dir: 'ltr', home: '/es/',
    ideas: '/es/', navAria: 'Menú principal',
    title: 'Lista de deseos y lista de regalos | GiveOwl',
    description: 'Crea una lista de deseos o una lista de regalos de Navidad y comparte un enlace de consulta. Sin cuenta. La familia puede reservar regalos. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/es/', 'Inicio'], ['f-konk', '/c/es/', 'Sorteos'], ['f-guide', '/es/guia/', 'Guías']],
  },
  it: {
    path: '/it/lista-dei-desideri/', hreflang: 'it', htmlLang: 'it', dir: 'ltr', home: '/it/',
    ideas: '/it/', navAria: 'Menu principale',
    title: 'Lista dei desideri e lista regali | GiveOwl',
    description: 'Crea una lista dei desideri o una lista regali di Natale e condividi un link di consultazione. Senza account. La famiglia può prenotare i regali. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/it/', 'Home'], ['f-konk', '/c/it/', 'Concorsi'], ['f-guide', '/it/guida/', 'Guide']],
  },
  'pt-BR': {
    path: '/pt-br/lista-de-desejos/', hreflang: 'pt-BR', htmlLang: 'pt-BR', dir: 'ltr', home: '/pt-br/',
    ideas: '/pt-br/', navAria: 'Menu principal',
    title: 'Lista de desejos e lista de presentes | GiveOwl',
    description: 'Crie uma lista de desejos ou uma lista de presentes de Natal e compartilhe um link de visualização. Sem conta. A família pode reservar presentes. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/pt-br/', 'Início'], ['f-konk', '/c/br/', 'Sorteios']],
  },
  pl: {
    path: '/pl/lista-zyczen/', hreflang: 'pl', htmlLang: 'pl', dir: 'ltr', home: '/pl/',
    ideas: '/pl/', navAria: 'Menu główne',
    title: 'Lista życzeń i lista prezentów | GiveOwl',
    description: 'Utwórz listę życzeń lub listę prezentów na święta i udostępnij link do podglądu. Bez konta. Bliscy mogą rezerwować prezenty. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/pl/', 'Start'], ['f-guide', '/pl/poradnik/', 'Poradniki']],
  },
  tr: {
    path: '/tr/istek-listesi/', hreflang: 'tr', htmlLang: 'tr', dir: 'ltr', home: '/tr/',
    ideas: '/tr/', navAria: 'Ana menü',
    title: 'İstek listesi ve hediye listesi | GiveOwl',
    description: 'Bir istek listesi veya hediye listesi oluşturun ve görüntüleme bağlantısını paylaşın. Hesap gerekmez. Aile hediyeleri ayırabilir. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/tr/', 'Ana sayfa']],
  },
  ja: {
    path: '/ja/hoshii-mono/', hreflang: 'ja', htmlLang: 'ja', dir: 'ltr', home: '/ja/',
    ideas: '/ja/', navAria: 'メインメニュー',
    title: 'ほしい物リストを作って共有 | GiveOwl',
    description: 'ほしい物リスト（欲しいものリスト）やギフトリストを作り、閲覧リンクを共有。アカウント不要。家族がプレゼントを予約できます。GiveOwl、HENDT AS。',
    tabs: [['f-hjem', '/ja/', 'ホーム'], ['f-konk', '/c/jp/', '懸賞']],
  },
  ko: {
    path: '/ko/wisilist/', hreflang: 'ko', htmlLang: 'ko', dir: 'ltr', home: '/ko/',
    ideas: '/ko/', navAria: '주 메뉴',
    title: '위시리스트와 선물 리스트 | GiveOwl',
    description: '위시리스트나 선물 리스트를 만들고 보기 링크를 공유하세요. 계정은 필요 없습니다. 가족이 선물을 예약할 수 있습니다. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/ko/', '홈']],
  },
  'zh-Hans': {
    path: '/zh-hans/xinyuandan/', hreflang: 'zh-Hans', htmlLang: 'zh-Hans', dir: 'ltr', home: '/zh-hans/',
    ideas: '/zh-hans/', navAria: '主菜单',
    title: '心愿单与愿望清单 | GiveOwl',
    description: '创建心愿单或礼物清单，并分享查看链接。无需账户。家人可以预订礼物。GiveOwl，HENDT AS。',
    tabs: [['f-hjem', '/zh-hans/', '首页']],
  },
  hi: {
    path: '/hi/wishlist/', hreflang: 'hi', htmlLang: 'hi', dir: 'ltr', home: '/hi/',
    ideas: '/hi/', navAria: 'मुख्य मेनू',
    title: 'विशलिस्ट और इच्छा सूची | GiveOwl',
    description: 'विशलिस्ट या इच्छा सूची बनाएँ और देखने का लिंक साझा करें। खाते की ज़रूरत नहीं। परिवार उपहार आरक्षित कर सकता है। GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/hi/', 'होम'], ['f-konk', '/c/in/', 'प्रतियोगिताएं']],
  },
  id: {
    path: '/id/daftar-keinginan/', hreflang: 'id', htmlLang: 'id', dir: 'ltr', home: '/id/',
    ideas: '/id/', navAria: 'Menu utama',
    title: 'Daftar keinginan dan daftar hadiah | GiveOwl',
    description: 'Buat daftar keinginan atau daftar hadiah dan bagikan tautan lihat. Tanpa akun. Keluarga dapat mencadangkan hadiah. GiveOwl, HENDT AS.',
    tabs: [['f-hjem', '/id/', 'Beranda']],
  },
  ar: {
    path: '/ar/qaimat-al-amaniyat/', hreflang: 'ar', htmlLang: 'ar', dir: 'rtl', home: '/ar/',
    ideas: '/ar/', navAria: 'القائمة الرئيسية',
    title: 'قائمة الأمنيات وقائمة الهدايا | GiveOwl',
    description: 'أنشئ قائمة أمنيات أو قائمة هدايا وشارك رابط المشاهدة. بلا حساب. يمكن للعائلة حجز الهدايا. GiveOwl من HENDT AS.',
    tabs: [['f-hjem', '/ar/', 'الرئيسية']],
  },
};

export function pathFor(lang) {
  return (META[lang] || META.nb).path;
}

export function normalizeLang(lang) {
  return Object.prototype.hasOwnProperty.call(META, lang) ? lang : 'nb';
}
