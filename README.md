# Hướng dẫn client của NKL Bank
Cảm ơn bạn đã lựa chọn sử dụng dịch vụ của NKL Bank, chúc bạn được điểm cao.
Tài liệu này: hướng dẫn bạn tải và config mã nguồn, link video hướng dẫn, sử dụng postman để test.
## 📦 Tải xuống và chạy thử
#### Source code

Bạn được cho là đã cài [git](https://git-scm.com/)

```bash
# Clone this repository
$ git clone https://github.com/ngankhanh98/internet-banking-parner.git
$ cd internet-banking-parner

# Install essential package
$ npm i

# Run in localhost
$ npm start
```
Một webservice đang chạy ở `http://localhost:5000/`

**File structure**

```
├── node_modules/
├── app.js
├── NKLBANK client.postman_collection.json
├── PGPpartnerbankClient.route.js
├── package-lock.json
└── package.json
```

#### Postman collection
Bạn import file **NKLBANK client.postman_collection.json** vào Postman rồi bắt đầu chạy thử.

## 🎯 Chỉnh sửa source code
File cần chỉnh sửa là: **PGPpartnerbankClient.route.js**<br>
Bạn cần vừa xem clip này vừa thực hiện: [Hướng dẫn dành cho client NKLBANK (PGP)](https://youtu.be/lMOxCBtjNGM)

## 🙏 Acknowledge
The essential knowledge is provided by the lecturer, Mr. Dang Khoa.
