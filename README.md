# QRORDER

스마트 QR 테이블 오더 MVP 웹사이트입니다.

## 구성

- 손님용 QR 웹 메뉴판
- 사장님용 실시간 주문 보드
- 메뉴 가격 및 품절 관리
- 테이블 QR 코드 생성 및 PNG 다운로드

## 로컬 실행

정적 사이트라 별도 빌드가 필요 없습니다. `index.html`을 브라우저에서 열거나 로컬 정적 서버로 실행하면 됩니다.

```powershell
node -e "require('http').createServer((req,res)=>require('fs').createReadStream(req.url==='/'?'index.html':'.'+decodeURIComponent(req.url)).pipe(res)).listen(4173)"
```

## 배포

GitHub Pages는 `main` 브랜치의 루트 경로(`/`)를 배포 소스로 사용합니다.
