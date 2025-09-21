# WDP301-FE

WDP301-FE là dự án Frontend cho môn học WDP301, sử dụng các công nghệ hiện đại như React, TypeScript, CSS và HTML. Dự án này nhằm xây dựng giao diện người dùng hiện đại, dễ bảo trì, phục vụ kết nối với Backend và đáp ứng các yêu cầu của môn học.

## Nội dung

- [Giới thiệu](#giới-thiệu)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Công cụ & Công nghệ sử dụng](#công-cụ--công-nghệ-sử-dụng)
- [Hướng dẫn phát triển](#hướng-dẫn-phát-triển)
- [Quy tắc code & quản lý dự án](#quy-tắc-code--quản-lý-dự-án)
- [Đóng góp](#đóng-góp)
- [Thông tin liên hệ](#thông-tin-liên-hệ)

---

## Giới thiệu

Dự án này phát triển giao diện người dùng cho hệ thống WDP301, tập trung vào trải nghiệm người dùng, tương tác linh hoạt và dễ dàng mở rộng.

## Yêu cầu hệ thống

- Node.js >= 18.x.x
- npm >= 9.x.x hoặc yarn >= 1.22.x
- Trình duyệt hiện đại (Chrome, Firefox, Edge, Safari)
- Git để quản lý mã nguồn

## Cài đặt

1. **Clone repo:**
   ```bash
   git clone https://github.com/marcopham01/WDP301-FE.git
   cd WDP301-FE
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   # hoặc
   yarn
   ```

3. **Chạy dự án phát triển:**
   ```bash
   npm start
   # hoặc
   yarn start
   ```

4. **Build production:**
   ```bash
   npm run build
   # hoặc
   yarn build
   ```

## Cấu trúc thư mục

```
WDP301-FE/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   ├── App.tsx
│   ├── index.tsx
│   └── ...
├── .env
├── package.json
└── README.md
```

- **public/**: Tài nguyên tĩnh (index.html, favicon...)
- **src/assets/**: Hình ảnh, icon, fonts...
- **src/components/**: Các component dùng chung
- **src/pages/**: Các trang chính
- **src/hooks/**: Custom hooks
- **src/utils/**: Các hàm tiện ích
- **src/services/**: Giao tiếp API

## Công cụ & Công nghệ sử dụng

- **React** (v18+)
- **TypeScript**
- **CSS/SCSS/Styled-components**
- **React Router**
- **Axios** (giao tiếp API)
- **ESLint + Prettier** (chuẩn hóa code)
- **Jest/React Testing Library** (unit test)
- **Git** (quản lý mã nguồn)

## Hướng dẫn phát triển

- **Tạo branch mới** cho mỗi feature/fix trước khi làm việc
- **Luôn cập nhật branch main** trước khi merge
- **Commit message** rõ ràng, theo chuẩn [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- **Kiểm tra mã nguồn với ESLint/Prettier** trước khi push:
  ```bash
  npm run lint
  npm run format
  ```

### Ví dụ commit message

```
feat: thêm trang đăng ký người dùng
fix: sửa validate form đăng nhập
refactor: tối ưu component Header
```

## Quy tắc code & quản lý dự án

- Tuân thủ quy tắc đặt tên biến, hàm, file thống nhất (camelCase, PascalCase, kebab-case)
- Tận dụng TypeScript để đảm bảo type safety
- Code sạch, có comment ở những đoạn logic phức tạp
- Không commit file build hoặc thư mục node_modules
- Sử dụng Pull Request để code review trước khi merge vào main

## Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo Issue hoặc Pull Request để đóng góp vào dự án.

## Thông tin liên hệ

- Chủ repo: [@marcopham01](https://github.com/marcopham01)
- Thành viên đóng góp: Xem [contributors](https://github.com/marcopham01/WDP301-FE/graphs/contributors)

---

> **Chú ý:** Các thông tin trong README này có thể cần cập nhật theo tiến độ thực tế dự án.