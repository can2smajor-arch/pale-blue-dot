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
