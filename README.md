# IT Job Platform Frontend

Frontend Next.js cho nen tang tim viec lam nganh IT tai Viet Nam.

## Muc tieu

Repo nay duoc chinh de phu hop voi demo local di cung backend trong `../it-job-platform`.

## Dieu kien can

- Node.js 20+
- npm 10+
- Backend + Kong da chay

## 1. Tao env

Copy `.env.example` thanh `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Gia tri mac dinh:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Frontend goi API qua Kong, khong goi truc tiep tung service.

## 2. Chay local

```powershell
npm run dev
```

Frontend se chay tai [http://localhost:3000](http://localhost:3000).

## 3. Build va lint

```powershell
npm run lint
npm run build
```

## 4. Tai khoan demo

- Admin: `admin@example.com` / `admin123`
- Recruiter: `recruiter@example.com` / `recruiter123`
- Candidate: `candidate@example.com` / `candidate123`

Login page da co nut dien nhanh de dien san 3 tai khoan nay. Sau do bam `DANG NHAP` de di qua auth that.

## 5. Luong demo khuyen nghi

- Candidate:
  - `Tim kiem viec lam`
  - `Viec lam yeu thich`
  - `Ho so`
- Recruiter:
  - `Quan ly bai dang`
  - `Them tin tuyen dung`
  - `Ho so`
- Admin:
  - `Bang dieu khien`
  - `Danh muc`
  - `Cong ty`

## 6. Neu frontend khong goi duoc API

- Kiem tra `NEXT_PUBLIC_API_URL`
- Kiem tra backend da chay sau Kong tai `http://localhost:8000`
- Kiem tra da seed tai khoan demo trong backend
