# 창백한 푸른 점

노화도 앞바다에서 출발해 우주정거장, 달, 행성, 보이저 1호의 '창백한 푸른 점'을 지나 관측 가능한 우주의 끝까지 갔다가 다시 노화도로 돌아오는 웹앱.

## 구성
- `public/` 화면 (index.html, story.js, tex/ 행성 표면 사진)
- `src/worker.js` Cloudflare Worker
  - `/api/iss` 우주정거장 궤도 (CelesTrak, 키 필요 없음)
  - `/api/ships` 노화도 앞바다 배 위치 (aisstream.io, 비밀값 `AISSTREAM_KEY`)
  - `/api/webcams` 세계 실시간 카메라 (Windy Webcams, 비밀값 `WINDY_KEY`)
- `wrangler.jsonc` Cloudflare 설정

비밀값은 Cloudflare 대시보드 → Workers & Pages → pale-blue-dot → Settings → Variables and Secrets 에서 'Secret'으로 넣습니다. 코드에는 넣지 않습니다.

## 출처
- 행성 위치: NASA JPL 근사 궤도요소 / 우주정거장: CelesTrak TLE, satellite.js
- 지도: © OpenStreetMap 기여자 (Leaflet)
- 표면 사진 (wakusei-planets 패키지에서 가져옴):
  - 퍼블릭 도메인: 지구 NASA Earth Observatory(Blue Marble), 달 NASA SVS/LRO, 화성 NASA/JPL/USGS(바이킹), 명왕성 NASA/JHUAPL/SwRI(뉴호라이즌스), 토성 고리 NASA/JPL/SSI(카시니)
  - CC BY 4.0: 태양·금성·해왕성·토성 Solar System Scope, 수성 Shady Tex·Solar System Scope, 목성·천왕성·토성 극 Nestaeric(Sketchfab)
- 우주정거장 생중계: NASA 공식 유튜브
- '창백한 푸른 점' 장면은 1990년 보이저 1호 사진(NASA/JPL)을 바탕으로 다시 그린 그림이며, 칼 세이건의 글은 인용하지 않고 우리말로 풀어 썼습니다.

## 이야기 속 사진
- NASA (퍼블릭 도메인): 국제우주정거장 S132-E-012208, 지구돋이 AS08-14-2383, 토성과 지구 PIA17172, 보이저 상상도 PIA17046, 창백한 푸른 점 PIA23645, 안드로메다 PIA15416(GALEX), 오늘의 태양 SDO/AIA, 최근 지구 사진 EPIC/DSCOVR
- ESO / S. Brunier — 은하수 파노라마 eso0932a (CC BY 4.0)
- NASA, ESA, CSA, STScI — 용골자리 성운 '우주 절벽' weic2205a (CC BY 4.0)
- NASA, ESA, S. Beckwith (STScI), HUDF Team — 허블 울트라 딥 필드 heic0611b (CC BY 4.0)

## 사람 눈높이 장면 (view.js)
- 지구 낮·밤 사진: NASA Blue Marble / Black Marble (three-globe 예제 이미지), 구름: NASA Blue Marble 구름층, 별: three-globe 예제 밤하늘, 달 표면: NASA LRO (globe.gl 예제)
- 노화도 둘레 섬 모양: southkorea-maps 2013 시군구 경계 해안선. 섬 높이는 실제 지형 자료가 아니라 섬 크기로 어림한 값
- 해·달 위치: 간단한 천문 계산(오차 1° 안팎)
- 섬과 바다의 실제 모습: Sentinel-2 cloudless 2020 by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2020, CC BY-NC-SA 4.0) — https://s2maps.eu
- 실제 지형 높이: Mapzen Terrarium terrain tiles (AWS Open Data; SRTM 등)
- 어제의 지구와 구름: NASA GIBS (VIIRS NOAA-20/21 Corrected Reflectance, Blue Marble)

## 먼 우주 장면 (deep.js)
- three.js r170 (MIT, public/lib) · 토성·고리 그림은 public/tex 행성 그림 사용
- 토성 곁, 보이저의 자리, 별 사이, 우리 은하, 은하의 바다 — 방향과 크기 비율은 보기 좋게 다듬은 값이 섞여 있어요(글 속 숫자는 실제 값)
