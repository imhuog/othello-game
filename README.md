# 🎮 Game Cờ Lật Online (Othello)

Game cờ lật trực tuyến với giao diện đẹp mắt, hỗ trợ multiplayer realtime và nhiều tính năng thú vị!

## ✨ Tính năng

### 🎯 Gameplay
- **Click để đi quân**: Nhấp vào ô trống để đặt quân
- **Highlight nước đi hợp lệ**: Các ô có thể đi sẽ có chấm tròn đánh dấu
- **Lật quân đúng luật Othello**: Tự động lật tất cả quân bị "kẹp" theo 8 hướng
- **Đổi lượt 2 người chơi**: Tự động chuyển lượt, bỏ lượt nếu không có nước đi hợp lệ
- **Đếm điểm cuối ván**: Hiển thị kết quả và người thắng cuộc

### 🎨 Giao diện dễ thương
- **Chọn emoji cho quân cờ**: Mỗi người chơi có 10 emoji để lựa chọn
- **UI gradient đẹp mắt**: Màu sắc hiện đại với hiệu ứng chuyển màu
- **Animation mượt mà**: Hiệu ứng lật quân từ từ, hover, và các chuyển động sinh động

### 📱 Responsive Mobile
- **Tối ưu cho điện thoại**: Layout tự động điều chỉnh theo màn hình
- **Touch-friendly**: Nút bấm và ô cờ kích thước phù hợp cho cảm ứng
- **Responsive design**: Hoạt động tốt trên mọi thiết bị

### 🎮 Tính năng thêm
- **Nút "Ván mới"**: Khởi tạo lại game bất cứ lúc nào
- **Nút "Luật chơi"**: Hiển thị hướng dẫn chi tiết
- **Màn hình kết thúc**: Thông báo người thắng với animation đẹp mắt

### 🏠 Tạo Room & Mời bạn
- **Tạo room với mã ID**: Tạo phòng chơi riêng với mã 6 ký tự
- **Chia sẻ link mời**: Copy link để gửi cho bạn bè
- **Join room**: Nhập mã phòng để vào chơi
- **Danh sách người chơi**: Hiển thị ai đang trong phòng
- **Thông báo toast**: Hiển thị thông báo dạng toast
- **Khung chat**: Chat trực tiếp khi chơi online

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18**: Framework chính
- **Socket.IO Client**: Kết nối realtime
- **React Hot Toast**: Thông báo đẹp mắt
- **CSS3**: Animation và responsive design

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **Socket.IO**: Realtime communication
- **CORS**: Cross-origin support

## 📦 Cấu trúc dự án

```
othello-game/
├── frontend/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js           # Component chính
│   │   ├── App.css          # Styles
│   │   └── index.js         # Entry point
│   ├── package.json
│   ├── vercel.json          # Config deploy Vercel
│   └── .env.example
├── backend/                  # Node.js backend
│   ├── server.js            # Server chính
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🚀 Hướng dẫn cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 14.0.0
- npm hoặc yarn
- Git

### 1. Clone repository

```bash
git clone https://github.com/your-username/othello-game.git
cd othello-game
```

### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chạy server development
npm run dev

# Hoặc chạy production
npm start
```

Backend sẽ chạy tại `http://localhost:5000`

### 3. Cài đặt Frontend

```bash
# Mở terminal mới, di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env
# Chỉnh sửa REACT_APP_SOCKET_URL nếu cần

# Chạy development server
npm start
```

Frontend sẽ chạy tại `http://localhost:3000`

### 4. Truy cập game

Mở trình duyệt và truy cập `http://localhost:3000` để bắt đầu chơi!

## 🌐 Deploy lên Production

### Deploy Frontend lên Vercel

1. **Tạo tài khoản Vercel** tại [vercel.com](https://vercel.com)

2. **Install Vercel CLI**:
```bash
npm i -g vercel
```

3. **Deploy frontend**:
```bash
cd frontend
vercel

# Làm theo hướng dẫn:
# - Chọn scope
# - Link to existing project? N
# - What's your project's name? othello-game-frontend
# - In which directory is your code located? ./
```

4. **Cấu hình Environment Variables** trên Vercel Dashboard:
   - `REACT_APP_SOCKET_URL`: URL của backend (ví dụ: https://your-backend.onrender.com)

5. **Redeploy** sau khi cấu hình:
```bash
vercel --prod
```

### Deploy Backend lên Render

1. **Tạo tài khoản Render** tại [render.com](https://render.com)

2. **Tạo Web Service mới** từ GitHub repository

3. **Cấu hình Build Settings**:
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Để trống

4. **Cấu hình Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (tự động được Render cung cấp)

5. **Deploy** và lấy URL backend

6. **Cập nhật Frontend** với URL backend mới và redeploy Vercel

### Cấu hình CORS

Sau khi deploy, cập nhật file `backend/server.js` với domain chính xác:

```javascript
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://your-vercel-app.vercel.app"  // Thay bằng domain Vercel của bạn
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
```

## 🎮 Cách chơi

### Luật cơ bản Othello/Reversi:

1. **Mục tiêu**: Chiếm được nhiều ô nhất trên bàn cờ 8x8
2. **Bắt đầu**: Người chơi đen đi trước
3. **Đặt quân**: Đặt quân để "kẹp" quân đối thủ theo 8 hướng (ngang, dọc, chéo)
4. **Lật quân**: Tất cả quân bị "kẹp" sẽ chuyển thành màu của bạn
5. **Bỏ lượt**: Nếu không có nước đi hợp lệ, bạn sẽ bị bỏ lượt
6. **Kết thúc**: Game kết thúc khi không còn ô trống hoặc cả hai không thể đi
7. **Chiến thắng**: Người có nhiều quân cờ hơn khi kết thúc sẽ thắng

### Chơi Online:

1. **Tạo phòng**: Nhập tên và nhấn "Tạo phòng mới"
2. **Mời bạn**: Copy link hoặc chia sẻ mã phòng 6 ký tự
3. **Bắt đầu**: Game tự động bắt đầu khi đủ 2 người
4. **Chat**: Sử dụng khung chat để trò chuyện
5. **Emoji**: Thay đổi emoji đại diện trong game

## 🐛 Troubleshooting

### Lỗi kết nối Socket.IO
```bash
# Kiểm tra backend có chạy không
curl http://localhost:5000

# Kiểm tra CORS configuration
# Đảm bảo frontend URL được thêm vào danh sách allowed origins
```

### Lỗi Build Frontend
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm start -- --reset-cache
```

### Lỗi Deploy Vercel
```bash
# Build locally để kiểm tra lỗi
npm run build

# Kiểm tra environment variables
vercel env ls
```

### Lỗi Deploy Render
- Kiểm tra logs trong Render Dashboard
- Đảm bảo Start Command chính xác: `cd backend && npm start`
- Verify package.json có đúng dependencies

## 📝 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo Pull Request hoặc Issue để báo lỗi/đề xuất tính năng mới.

## 📞 Liên hệ

- Email: your-email@example.com
- GitHub: [@your-username](https://github.com/your-username)

---

**Chúc bạn chơi game vui vẻ! 🎮🎉**
