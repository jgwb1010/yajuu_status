# 야수선배 니코동 상태창: 처음부터 따라하기

## 준비
컴퓨터에 Node.js LTS 설치 → 터미널(PowerShell)에서 이 폴더로 이동.

## 배포
1. `npx wrangler login` (Cloudflare 로그인)
2. `npx wrangler deploy` (인터넷에 업로드)
3. 명령어가 보여준 `https://...workers.dev` 주소 뒤에 `/status?heat=72&calm=61&mystery=34`를 붙여 열기.

## 핵심 파일
- `src.js`: 주소 뒤 변수들을 읽어 SVG 안의 글자와 도형을 조립
- `public/base.svg`: 커다란 글꼴 데이터가 임베드된 템플릿(폰트 저작권 조건 준수)
- `wrangler.toml`: 배포 설정. 동일 이름의 Worker가 있다면 `name` 변경.

## 기본 변수
`date` 날짜, `time` 시간, `loc` 장소, `stage` 진행, `outfit` 선배 의상, `situation` 현 상황, `mood` 겉태도, `heat` 기세(0-100), `calm` 평정(0-100), `mystery` 의미심장(0-100), `mind` 속마음, `c1` ~ `c10` 선택지. `blank=1`은 빈 버전.

## 사용 예시
`/status?date=2006.08.12&time=16%3A30&loc=%EC%98%A5%EC%83%81&heat=95&c1=%EB%94%B0%EB%9D%BC%EA%B0%84%EB%8B%A4`

한글은 사람이 직접 쓴 URL에서도 브라우저가 처리하는 경우가 많지만, AI에게는 `encodeURIComponent`로 인코딩된 URL을 내놓게 하는 것이 안전하다.

## 작동 원리
URL → Workers → 매개변수 읽기 → 텍스트 XML 이스케이프(문자 깨짐 및 SVG 삽입 방지) → 문장 줄바꿈 → 필요한 높이 계산 → SVG 반환.

## 알아둘 점
- 이미지 URL 안 텍스트는 방문자와 서비스를 운영하는 서버에 노출될 수 있음. 개인 비밀을 넣지 않는 것을 권장.
- 긴 URL은 플랫폼마다 잘릴 수 있으며 AI가 URL 인코딩을 잘못할 수도 있음. 짧은 선택지로 시험 시작.
- 일부 캐릭터챗 플랫폼은 외부 SVG를 이미지로 표시하지 않을 수 있음. 이 경우 별도의 PNG 렌더링 서버가 필요.
- PNG로 바꾸는 것만으로 SVG에 삽입한 폰트 렌더링 문제가 모두 해결되지는 않으므로 실서비스 환경에서 테스트해야 함.
- 키워드를 URL 안에 넣었다고 해서 캐챗 로어북이 반드시 호출되는 것은 아님. 플랫폼의 매칭 범위 검사 필수.
- 배포 직후 `?blank=1`, `?heat=100`, `?c1=...&c2=...`로 개별 기능을 확인.
