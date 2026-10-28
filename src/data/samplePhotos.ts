// 시나리오 C: 미리 준비한 샘플 사진. 이 사진들만 "분석 결과"를 연결해 두고,
// 사용자가 직접 올린 사진은 분석하는 척하지 않고 특징을 물어본다 (명세서 §2 시나리오 C).

export interface SamplePhoto {
  id: string;
  label: string;
  imageUrl: string;
  /** 사진 속 옷과 같은 상품. 이 상품을 기준으로 비슷한 옷을 찾는다 */
  productId: string;
  /** "사진 속 옷은 ○○ 같아요" 다음에 붙는 특징 설명 */
  features: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-ma1',
    label: '퍼 칼라 항공점퍼',
    imageUrl: 'https://image.msscdn.net/images/goods_img/20260915/7334751/7334751_17913580283551_500.jpg',
    productId: '7334751',
    features: '블랙, 퍼 칼라, 짧은 기장의 스트릿 무드',
  },
  {
    id: 'sample-hoodie',
    label: '로고 후드티',
    imageUrl: 'https://image.msscdn.net/images/goods_img/20250220/4813641/4813641_17400440776676_500.jpg',
    productId: '4813641',
    features: '블랙, 가슴 로고, 오버핏',
  },
  {
    id: 'sample-coat',
    label: '울 롱코트',
    imageUrl: 'https://image.msscdn.net/images/goods_img/20260929/7420291/7420291_17906745787249_500.jpg',
    productId: '7420291',
    features: '블랙, 싱글 브레스티드, 미니멀한 롱 기장',
  },
];

export const getSamplePhoto = (id: string) => SAMPLE_PHOTOS.find((s) => s.id === id);
