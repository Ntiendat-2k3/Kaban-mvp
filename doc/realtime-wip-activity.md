# Realtime, giới hạn WIP và nhật ký hoạt động

## Realtime

Server phát `board:changed` sau khi thao tác được lưu. Client ở trang bảng dùng Socket.IO để nhận tín hiệu và tải lại dữ liệu bảng. Khi đang kéo thẻ, việc tải lại được hoãn đến khi kết thúc kéo.

- Socket kết nối trực tiếp đến server qua `NEXT_PUBLIC_SOCKET_URL` (mặc định `http://localhost:4000`). REST vẫn dùng `NEXT_PUBLIC_API_URL` (mặc định `/api`).
- Socket xác thực bằng JWT trong `auth.token`. Chỉ thành viên bảng được tham gia phòng `board:<boardId>`.
- Sự kiện chỉ gồm loại thay đổi, người thực hiện và ID thẻ nếu có. Dữ liệu chi tiết vẫn được đọc qua REST.
- Khi triển khai sau reverse proxy, đặt `TRUST_PROXY=true` trên server để giới hạn tốc độ theo IP thật.

## Giới hạn WIP

Mỗi cột có `wipLimit` là số nguyên dương hoặc `null`. Dùng menu của cột để đặt giới hạn; để trống và lưu để bỏ giới hạn. Tiêu đề cột hiện số thẻ hiện có trên giới hạn, đổi màu khi cột đã đầy.

`PATCH /api/lists/{listId}` nhận `{ "wipLimit": 2 }` hoặc `{ "wipLimit": null }`. Tạo, nhân bản hoặc chuyển thẻ sang cột khác đã đầy trả `409` với mã `WIP_LIMIT_EXCEEDED`. Đổi thứ tự trong cùng cột vẫn được phép.

## Nhật ký hoạt động

`GET /api/boards/{boardId}/activities?limit=30&before=<ISO date>` trả danh sách mới nhất trước, tối đa 100 bản ghi mỗi lần. Mỗi bản ghi có `actor: { id, name }`. Người ngoài bảng nhận `404`. Nhật ký ghi các thao tác thẻ chính, thành viên thẻ và bình luận mới; lỗi ghi nhật ký được báo ở server nhưng không làm hỏng thao tác chính.

## Đổi tên thẻ và màu cột

Nhấp thẻ để mở chi tiết trong hộp thoại. Menu của thẻ có mục **Đổi tên thẻ**; nhấp đúp vào thẻ cũng mở ô đổi tên ngay tại vị trí tiêu đề. Nội dung thẻ vẫn hiển thị, thẻ không co lại khi sửa và ô nhập có viền focus rõ ràng. Enter hoặc rời ô sẽ lưu, Escape hủy.

Menu của cột có mục **Màu cột** với tám màu giống bảng màu nền của bảng và lựa chọn **Bỏ màu cột**. `PATCH /api/lists/{listId}` nhận `color` là một tên màu hợp lệ hoặc `null`; `GET /api/boards/{boardId}` trả màu của từng cột. Các cột cũ mặc định không có màu riêng.

## Xóa thẻ

Mục **Xóa thẻ** trong menu thẻ và phím Delete gọi `DELETE /api/cards/{cardId}` sau khi người dùng xác nhận. Thẻ, checklist, bình luận, nhãn, thành viên và tệp đính kèm bị xóa vĩnh viễn; không thể khôi phục. Tệp trên Cloudinary chỉ được dọn khi không còn bản sao nào dùng chung. Nhật ký bảng giữ lại sự kiện `card.deleted` với tiêu đề thẻ. Nút **Lưu trữ** trong hộp thoại chi tiết vẫn dùng API lưu trữ và có thể khôi phục.

Để tìm lại thẻ hoặc danh sách đã lưu trữ, mở menu ba chấm của bảng và chọn **Kho lưu trữ**. Thành viên bảng có thể bấm **Khôi phục** để đưa danh sách về cuối bảng hoặc thẻ về danh sách gốc. `GET /api/boards/{boardId}/archived-lists` và `GET /api/boards/{boardId}/archived-cards` chỉ trả dữ liệu cho thành viên bảng. `POST /api/lists/{listId}/restore` khôi phục danh sách cùng các thẻ chưa lưu trữ bên trong. Nếu danh sách gốc đã lưu trữ, khôi phục danh sách trước rồi mới khôi phục thẻ. Thẻ đã xóa vĩnh viễn không xuất hiện trong kho lưu trữ.

## Tự kiểm tra

1. Mở cùng một bảng bằng hai tài khoản thành viên trên hai trình duyệt. Kéo thẻ ở một bên; bên còn lại phải tự cập nhật. Thử token sai và tài khoản ngoài bảng để xác nhận không nhận sự kiện.
2. Đặt giới hạn WIP bằng số thẻ hiện có, kéo thêm thẻ vào. Kiểm tra `409`, thông báo lỗi và thứ tự thẻ được hoàn tác. Đổi thứ tự trong chính cột đầy và xóa giới hạn để xác nhận hai thao tác vẫn hoạt động.
3. Di chuyển thẻ giữa hai cột, gọi endpoint nhật ký và kiểm tra đúng một mục `card.moved` với `fromList` và `toList`. Gọi lại với `before` bằng thời gian của mục cuối để xem trang tiếp theo; tài khoản ngoài bảng phải nhận `404`.
4. Nhấp thẻ và kiểm tra hộp thoại chi tiết. Đóng bằng X/Escape; thử đổi tên từ menu và bằng nhấp đúp, xác nhận thẻ không co lại và ô nhập được focus, rồi tải lại trang để xác nhận tên được lưu.
5. Chọn từng màu và bỏ màu từ menu cột; tải lại trang để xác nhận lựa chọn được giữ. Kiểm tra cột không màu cũ vẫn hiển thị như trước.
6. Tạo một thẻ thử, xóa từ menu và xác nhận thẻ biến mất sau khi tải lại trang, API chi tiết trả 404. Thử lưu trữ một thẻ khác trong hộp thoại và xác nhận vẫn có thể khôi phục.
7. Sau khi lưu trữ một thẻ hoặc danh sách, mở **Kho lưu trữ** từ menu bảng, bấm **Khôi phục** và xác nhận mục trở lại bảng. Kiểm tra người ngoài bảng nhận 404 từ hai API liệt kê; thẻ thuộc danh sách đã lưu trữ yêu cầu khôi phục danh sách trước.
