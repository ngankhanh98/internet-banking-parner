# Hướng dẫn client của NKL Bank
Cảm ơn bạn đã lựa chọn sử dụng dịch vụ của NKL Bank, chúc bạn được điểm cao.<br>
Video hướng dẫn (trăm nghe không bằng một thấy): [Hướng dẫn dành cho client NKLBANK (PGP)](https://youtu.be/lMOxCBtjNGM)
## 📦 Tải xuống và chạy thử
#### Source code

Bạn được cho là đã cài [git](https://git-scm.com/)

```bash
# Clone this repository
$ git clone https://github.com/ngankhanh98/internet-banking-parner.git
$ cd internet-banking-parner

# If you're from MPBank
$ git checkout mpbank

# If you're from s2q-ibank
$ git checkout s2q-ibank

# Install essential package
$ npm i

# Run in localhost
$ npm start
```
Một webservice đang chạy ở `http://localhost:5000/` nhưng ta chưa làm được gì với nó đâu.

#### Postman collection
Nếu bạn là mpbank, import **mpbank.postman_collection.json**.<br>
Nếu bạn là s2q-ibanking, import **s2q-ibanking.postman_collection.json**. Import lộn thì cũng chạy được, nhưng mà chạy của người ta.

## 🎯 Chỉnh sửa source code
File cần chỉnh sửa là: **mpbank-client.route.js** hoặc **s2q-ibank-client.route.js** tùy nhánh bạn đang checkout<br>
Vui lòng xem video thực hiện tốt nhất.

## 🙏 Acknowledge
The essential knowledge is provided by the lecturer, Mr. Dang Khoa.
