export interface ContentItem {
  text: string;
  author: string;
}

export const faithVerses: ContentItem[] = [
  { text: '너의 행사를 여호와께 맡기라 그리하면 네가 경영하는 것이 이루어지리라', author: '잠언 16:3' },
  { text: '네 길을 여호와께 맡기라 그를 의지하면 그가 이루시고 네 의를 빛 같이 나타내시며', author: '시편 37:5-6' },
  { text: '마음의 경영은 사람에게 있어도 말의 응답은 여호와께로부터 나오느니라', author: '잠언 16:1' },
  { text: '사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라', author: '잠언 16:9' },
  { text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라', author: '빌립보서 4:13' },
  { text: '네 시작은 미약하였으나 네 나중은 심히 창대하리라', author: '욥기 8:7' },
  { text: '구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니', author: '마태복음 7:7' },
  { text: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요', author: '이사야 40:31' },
  { text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라', author: '이사야 41:10' },
  { text: '무릇 지킬 만한 것 중에 더욱 네 마음을 지키라 생명의 근원이 이에서 남이니라', author: '잠언 4:23' },
  { text: '범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라', author: '데살로니가전서 5:18' },
  { text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라', author: '잠언 3:5-6' },
  { text: '우리가 선을 행하되 낙심하지 말지니 포기하지 아니하면 때가 이르매 거두리라', author: '갈라디아서 6:9' },
  { text: '지혜를 얻는 것이 은을 얻는 것보다 낫고 그 이익이 정금보다 나음이니라', author: '잠언 3:14' },
  { text: '평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라', author: '요한복음 14:27' }
];

export const generalQuotes: ContentItem[] = [
  { text: '천재는 1%의 영감과 99%의 노력으로 만들어진다.', author: '토마스 에디슨' },
  { text: '가장 큰 영광은 한 번도 실패하지 않는 것이 아니라, 실패할 때마다 다시 일어나는 데 있다.', author: '넬슨 만델라' },
  { text: '시작하는 방법은 말하는 것을 그만두고 행동하는 것이다.', author: '월트 디즈니' },
  { text: '당신의 시간을 다른 사람의 삶을 사느라 낭비하지 마십시오.', author: '스티브 잡스' },
  { text: '할 수 있다고 믿는 사람은 결국 해내고, 할 수 없다고 믿는 사람은 결국 해내지 못한다.', author: '헨리 포드' },
  { text: '미래를 예측하는 가장 좋은 방법은 미래를 창조하는 것이다.', author: '피터 드러커' },
  { text: '우리가 반복적으로 하는 행동이 바로 우리다. 그렇다면 탁월함은 행동이 아니라 습관이다.', author: '아리스토텔레스' },
  { text: '어제보다 나은 오늘을 만드는 것이 배움의 본질이다.', author: '공자' },
  { text: '가장 훌륭한 예술가는 모든 돌 속에 들어있는 형상을 보는 사람이다.', author: '미켈란젤로' },
  { text: '성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 계속해 나가는 용기다.', author: '윈스턴 처칠' },
  { text: '계획 없는 목표는 단지 희망사항에 불과하다.', author: '생텍쥐페리' },
  { text: '오늘 할 수 있는 일을 내일로 미루지 말라.', author: '벤자민 프랭클린' },
  { text: '너 자신을 믿어라. 온 우주가 너를 도울 것이다.', author: '랄프 왈도 에머슨' },
  { text: '단지 쳐다보는 것만으로는 강을 건널 수 없다. 물속으로 들어가야 한다.', author: '라빈드라나트 타고르' },
  { text: '인생에서 가장 큰 배움은 실패에서 온다. 실패를 두려워하지 말라.', author: '버락 오바마' }
];

export const getDailyContent = (dateStr: string, mode: 'general' | 'faith'): ContentItem => {
  // Use date string to deterministically select a quote for the day
  const list = mode === 'faith' ? faithVerses : generalQuotes;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
};
