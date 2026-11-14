# KỊCH BẢN THUYẾT TRÌNH & REVIEW TRƯỚC HỘI ĐỒNG
## PHÂN HỆ: CLASSROOM & LEARNING MANAGEMENT (LỚP HỌC & ĐÀO TẠO)
**Người thực hiện (PIC):** Cường  
**Phạm vi đảm nhiệm (7 Use Cases):** UC21, UC22, UC23, UC24, UC26, UC27, UC33  
**Công nghệ:** React 19 (Vite), Express 5, Node.js, MongoDB (Mongoose), JWT, Zod  

---

## MỤC LỤC
1. [Phần 1: Lời mở đầu & Định vị phân hệ (1 - 2 phút)](#1-lời-mở-đầu--định-vị-phân-hệ)
2. [Phần 2: Kịch bản Demo thực chiến từng bước (5 - 7 phút)](#2-kịch-bản-demo-thực-chiến-từng-bước)
3. [Phần 3: Trình bày Kiến trúc kỹ thuật & Luồng Code (Code Flow)](#3-trình-bày-kiến-trúc-kỹ-thuật--luồng-code)
4. [Phần 4: Các Business Rules & Quyết định thiết kế đắt giá](#4-các-business-rules--quyết-định-thiết-kế-đắt-giá)
5. [Phần 5: Bộ câu hỏi phản biện của Hội đồng (Q&A Defense)](#5-bộ-câu-hỏi-phản-biện-của-hội-đồng)
6. [Phần 6: Bảng tra cứu File Code nhanh khi Thầy/Cô hỏi](#6-bảng-tra-cứu-file-code-nhanh)

---

## 1. LỜI MỞ ĐẦU & ĐỊNH VỊ PHÂN HỆ

### Lời thoại mẫu mở đầu (Nói tự tin, rõ ràng, phong thái chuyên nghiệp):
> *"Kính thưa quý thầy cô trong Hội đồng phản biện,*  
> *Em tên là [Cường], đảm nhiệm vai trò phụ trách phân hệ **Quản lý Lớp học & Đào tạo trực tuyến (Classroom & Learning Management)** trong dự án TuConnector, bao gồm 7 Use Cases chính từ **UC21 đến UC24, UC26, UC27 và UC33**.*  
>  
> *Trong nền tảng TuConnector, sau khi Gia sư và Phụ huynh/Học sinh kết nối thành công, phân hệ của em chính là **trọng tâm giá trị (Core Value)** của sản phẩm — nơi diễn ra toàn bộ hoạt động dạy học thực tế: từ khởi tạo không gian lớp học, tiếp nhận học sinh, giao và tự động chấm bài tập, đến tương tác nhóm thời gian thực.*  
>  
> *Sau đây, em xin phép trình bày chi tiết về **nghiệp vụ thực tế qua bản demo sản phẩm**, sau đó là **kiến trúc luồng code** và **các quyết định kỹ thuật quan trọng** mà em đã triển khai."*

---

## 2. KỊCH BẢN DEMO THỰC CHIẾN TỪNG BƯỚC

Chuẩn bị trước 2 tab trình duyệt:
- **Tab thường (Gia sư):** Đăng nhập tài khoản Tutor.
- **Tab ẩn danh / Trình duyệt khác (Học sinh):** Đăng nhập tài khoản Student.

### Bước 1: Khởi tạo lớp học mới (UC21)
- **Thao tác:** Gia sư vào menu **"Lớp học của tôi"** (`/student/classes` hoặc menu Gia sư) ➔ Bấm **"+ Tạo lớp học ngay"**.
- **Điểm nhấn nghiệp vụ để khoe với thầy cô:**
  1. *Tạo nhanh từ thỏa thuận kết nối:* Checkbox "Tạo nhanh từ thỏa thuận kết nối đã xác nhận" giúp tự động điền môn học, khối lớp và học phí mà không cần nhập lại.
  2. *Combobox UX thông minh:* Môn học và Khối lớp vừa có danh mục gợi ý sẵn (Toán, Lý, Hóa, IELTS...), vừa cho phép gia sư tự gõ môn/khối đặc thù.
  3. *Tự động sinh mã tham gia:* Hệ thống tự động sinh `join_code` ngẫu nhiên và `invite_link`.
  4. *Tự động liên kết UC33:* Một phòng chat nhóm (`CLASS_GROUP_CHAT`) được tạo ngầm ngay lập tức cùng với lớp học.

### Bước 2: Học sinh tham gia lớp học (UC24)
- **Thao tác:** Chuyển sang Tab Học sinh ➔ Vào link mời hoặc nhập mã `join_code` tại `/join-class`.
- **Điểm nhấn nghiệp vụ:**
  - *Màn hình Preview công khai:* Người dùng chưa đăng nhập vẫn xem trước được tên lớp, gia sư phụ trách, sĩ số.
  - *4 tầng kiểm tra an toàn:* Kiểm tra lớp có đang `ACTIVE` không, kiểm tra sĩ số lớp có bị quá tải không, chặn gia sư tự làm học sinh lớp mình, và đặc biệt **chặn học sinh đã từng bị gỡ khỏi lớp tái gia nhập trái phép**.

### Bước 3: Quản lý thành viên & Bảng tin lớp (UC22 & UC23)
- **Thao tác:** Gia sư mở lớp ➔ Tab **"Thành viên"** & Tab **"Bảng tin"**.
- **Điểm nhấn nghiệp vụ:**
  - *Xem thành viên & vai trò:* Phân định rõ Gia sư, Học sinh, Phụ huynh và liên kết Con học sinh.
  - *Thêm học sinh trực tiếp:* Gia sư có thể thêm học sinh bằng email đã đăng ký.
  - *Gỡ thành viên (Soft Delete):* Gia sư gỡ học sinh kèm lý do. Bản ghi chuyển sang `REMOVED` để lưu vết học tập và ngăn chặn vào lại bằng mã cũ.
  - *Bảng tin lớp:* Đăng thông báo, ghim thông báo quan trọng lên đầu lớp (`is_pinned`).

### Bước 4: Tạo bài tập & Chấm điểm tự động (UC26 & UC27)
- **Thao tác:** Gia sư vào Tab **"Bài tập"** ➔ Bấm **"+ Tạo bài tập mới"**.
- **Điểm nhấn nghiệp vụ:**
  - Hỗ trợ 3 loại câu hỏi: Trắc nghiệm (`MULTIPLE_CHOICE`), Tự luận (`SHORT_ANSWER`), Nộp link file (`FILE_UPLOAD`).
  - Đặt hạn nộp (`due_date`), cho phép nộp trễ (`allow_late_submission`).
  - Hỗ trợ trợ lý AI sinh câu hỏi mẫu theo môn học.
- **Học sinh làm bài (UC27):**
  - Học sinh mở bài tập, chọn đáp án trắc nghiệm, viết câu trả lời ngắn ➔ Bấm **"Nộp bài"**.
  - **Auto-grading:** Hệ thống lập tức chấm điểm trắc nghiệm tự động và hiển thị ngay `provisional_score` (Điểm tạm tính) cho học sinh.
- **Gia sư chấm điểm & Công bố (UC26):**
  - Gia sư mở danh sách bài nộp (`Submissions`), xem bài làm của học sinh, chấm điểm câu tự luận, nhập nhận xét (`overall_feedback`) ➔ Bấm **"Công bố kết quả"**.
  - **Quy tắc bất biến:** Sau khi công bố kết quả (`results_published_at != null`), hệ thống khóa vĩnh viễn cấu trúc đề thi để đảm bảo tính công bằng học thuật.

### Bước 5: Nhóm chat lớp học & phân quyền (UC33)
- **Thao tác:** Mở Tab **"Nhóm chat"** trong lớp.
- **Điểm nhấn nghiệp vụ:**
  - Tự động hiển thị danh sách thành viên với vai trò (`Gia sư`, `Học sinh`, `Phụ huynh`).
  - Hỗ trợ gửi tin nhắn văn bản, hình ảnh, file đính kèm.
  - Polling tự động làm mới tin nhắn mỗi 4 giây, cuộn mượt xuống cuối tin nhắn mới nhất.

---

## 3. TRÌNH BÀY KIẾN TRÚC KỸ THUẬT & LUỒNG CODE

```
[Client: React 19 UI]
       │
       ▼ (1) Gọi hàm API qua Axios Client (src/services/classroomService.js)
[Axios Instance: src/services/api.js] (Tự động đính kèm JWT Bearer Token)
       │
       ▼ (2) HTTP Request (RESTful API)
[Express 5 Router: backend/src/routes/classroom.routes.js]
       │
       ▼ (3) Auth & RBAC Middleware (backend/src/middlewares/classroomAuth.middleware.js)
       │     (Xác thực Token, phân quyền requireTutorAuth / requireUserAuth)
       │
       ▼ (4) Controller Layer (backend/src/controllers/classroom.controller.js)
       │     (Đọc req.body/params/query, bọc asyncHandler, định dạng responseCommon)
       │
       ▼ (5) Service Layer (backend/src/services/classroom.service.js)
       │     (CHỨA 100% BUSINESS LOGIC: Kiểm tra sĩ số, auto-grading, soft delete, sinh mã)
       │
       ▼ (6) Mongoose ODM Layer (Classroom, ClassMember, Assignment, AssignmentSubmission)
[MongoDB Database: WDP_DB]
```

### Điểm nhấn khi trả lời về kiến trúc:
1. **Separation of Concerns:** Tách biệt hoàn toàn giữa Controller (chỉ làm HTTP transport) và Service (chứa toàn bộ nghiệp vụ thuần túy), giúp code độc lập và viết Unit Test rất dễ dàng.
2. **Modular Frontend:** `ClassroomDetail.jsx` không bị phình to hàng ngàn dòng mà được chia tách thành các sub-components độc lập theo từng tab: `ClassroomAnnouncementsTab`, `ClassroomAssignmentsTab`, `ClassroomMembersTab`, `ClassroomChatTab`.

---

## 4. CÁC BUSINESS RULES & QUYẾT ĐỊNH THIẾT KẾ ĐẮT GIÁ

Đây là những điểm mà Hội đồng rất thích vì thể hiện tư duy thiết kế chuyên sâu:

1. **Quy tắc Soft Delete thành viên (Bảo mật & Toàn vẹn dữ liệu):**
   - Không dùng `deleteOne` mà cập nhật `status = 'REMOVED'` kèm `removal_reason`.
   - *Lý do:* Lưu vết bài làm cũ không bị mồ côi dữ liệu, và ngăn chặn học sinh bị đuổi dùng mã mời cũ để tự ý vào lại lớp.
2. **Quy tắc Khóa đề bài sau khi Công bố điểm (Data Integrity Rule):**
   - Khi bài tập đã có `results_published_at`, cấm mọi hành vi sửa câu hỏi, xóa câu hỏi hoặc sửa thang điểm để không làm sai lệch điểm số đã công bố cho học sinh.
3. **Quy tắc Sĩ số tối đa (Capacity Guard):**
   - Khi sửa thông tin lớp, gia sư không thể hạ sĩ số tối đa nhỏ hơn số lượng học viên thực tế đang có trong lớp.
4. **Quy tắc Chấm điểm 2 giai đoạn (Two-phase Grading):**
   - Giai đoạn 1: Máy tự động chấm điểm trắc nghiệm (`provisional_score`) ngay khi học sinh bấm nộp bài.
   - Giai đoạn 2: Gia sư chấm điểm câu tự luận/file và chốt điểm chính thức (`final_score`).
5. **Combobox Input (Trải nghiệm người dùng thực tế):**
   - Kết hợp giữa Dropdown gợi ý danh mục chuẩn và Input tự do, giải quyết bài toán gia sư dạy các bộ môn chuyên sâu, luyện thi chứng chỉ đặc thù mà danh mục cố định không bao quát hết.

---

## 5. BỘ CÂU HỎI PHẢN BIỆN CỦA HỘI ĐỒNG (Q&A DEFENSE)

### Câu 1: "Tại sao em tách Controller và Service riêng mà không viết gộp?"
> **Trả lời:** Em áp dụng nguyên lý **Separation of Concerns**:
> - Controller chỉ làm nhiệm vụ tiếp nhận HTTP request, validate dữ liệu đầu vào và trả về JSON chuẩn hóa.
> - Service chứa 100% logic nghiệp vụ thuần túy và tương tác với Database. Nhờ vậy logic nghiệp vụ hoàn toàn độc lập với Express, có thể tái sử dụng và viết Unit Test rất thuận tiện mà không cần mock đối tượng `req, res`.

### Câu 2: "Cơ chế bảo mật nào ngăn học sinh gian lận điểm hoặc nộp bài sau hạn?"
> **Trả lời:**
> 1. Toàn bộ logic chấm điểm trắc nghiệm nằm ở **Backend Service**, frontend không lưu đáp án đúng nên học sinh không thể soi mã nguồn client để tìm câu trả lời.
> 2. Khi nộp bài, Backend so sánh thời gian hiện tại với `due_date`. Nếu quá hạn và bài tập không bật `allow_late_submission`, Backend ném lỗi 400 chặn nộp ngay lập tức. Nếu bật nộp trễ, hệ thống tự động gán nhãn `timeliness = 'LATE'` để gia sư trừ điểm nộp trễ.

### Câu 3: "Khi nhiều học sinh cùng vào lớp bằng mã mời cùng một lúc (Concurrency), em xử lý thế nào để không bị vượt sĩ số?"
> **Trả lời:**
> Trong `classroom.service.js`, trước khi thêm thành viên mới, hệ thống đếm số lượng `ClassMember` đang có trạng thái `ACTIVE` và so sánh với `capacity` của lớp. Nếu số lượng thành viên đã đạt mức tối đa, hệ thống ném ra lỗi `AppError('Lớp học đã đầy sĩ số', 400)` và từ chối thêm mới.

### Câu 4: "Tại sao câu hỏi (questions) được nhúng (embed) vào bảng Assignment, còn bài nộp (submissions) lại tách bảng riêng?"
> **Trả lời:** Em tuân thủ nguyên lý thiết kế cơ sở dữ liệu MongoDB:
> - **Embed questions:** Số lượng câu hỏi của một bài tập là hữu hạn (thường từ 5 - 50 câu) và luôn được đọc kèm với đề bài. Nhúng questions giúp đọc đề bài chỉ tốn duy nhất 1 query (tối ưu tốc độ).
> - **Reference submissions:** Một bài tập có thể có rất nhiều học sinh nộp bài và mỗi bài nộp có thể nộp lại nhiều lần. Nếu nhúng submissions vào Assignment sẽ gây nguy cơ vượt quá giới hạn 16MB một Document của MongoDB và gây xung đột ghi (write conflict) khi nhiều học sinh nộp bài cùng lúc.

### Câu 5: "Thế phần Lịch học của lớp nằm ở đâu trong bài của em?"
> **Trả lời (Khéo léo phân định nhiệm vụ nhóm):**
> *"Dạ thưa thầy/cô, theo sự phân công công việc trong nhóm: Bạn Nghĩa phụ trách phân hệ Lịch học (UC28 đến UC32). Còn phân hệ của em (Cường) chịu trách nhiệm toàn bộ về **Lõi đào tạo và Quản trị lớp học (UC21 - UC24, UC26, UC27, UC33)** gồm: cấu trúc lớp, thành viên, giao & chấm bài tập, bảng tin và nhóm chat lớp học. Hai phân hệ của chúng em tích hợp mượt mà với nhau qua mã lớp học `class_id` ạ."*

---

## 6. BẢNG TRA CỨU FILE CODE NHANH KHI THẦY/CÔ HỎI

| Khi Thầy/Cô hỏi xem... | File cần mở ngay lập tức | Hàm / Dòng tiêu biểu |
| :--- | :--- | :--- |
| **Định tuyến toàn bộ API lớp** | `backend/src/routes/classroom.routes.js` | Các route `POST /`, `POST /join`, `POST /assignments` |
| **Logic nghiệp vụ chính (Tạo lớp, Sĩ số)** | `backend/src/services/classroom.service.js` | Hàm `createClassroom`, `joinClassroom` |
| **Tự động chấm điểm trắc nghiệm** | `backend/src/services/classroom.service.js` | Hàm `submitAssignment` (tính `provisional_score`) |
| **Khóa đề bài sau công bố** | `backend/src/services/classroom.service.js` | Hàm `updateAssignment`, `publishAssignmentResults` |
| **Phân quyền người dùng / Gia sư** | `backend/src/middlewares/classroomAuth.middleware.js` | `requireTutorAuth`, `requireUserAuth` |
| **Giao diện tạo lớp & Combobox** | `frontend/src/pages/classroom/CreateClassroomModal.jsx` | Component `Combobox` chọn & nhập tự do môn/khối |
| **Chi tiết lớp chia 4 Tab** | `frontend/src/pages/classroom/ClassroomDetail.jsx` | Import và render 4 Tab components |
| **Làm bài tập & nộp bài** | `frontend/src/pages/classroom/DoAssignmentModal.jsx` | Xử lý radio button trắc nghiệm & submit form |
| **Gia sư chấm điểm bài nộp** | `frontend/src/pages/classroom/GradeAssignmentPage.jsx` | Chấm điểm tự luận, nhập feedback và công bố điểm |

